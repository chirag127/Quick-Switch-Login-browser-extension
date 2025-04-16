/**
 * Background script for the Quick Switch Login extension
 * Handles context menu, sync operations, and other background tasks
 */

// Create context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Create the "Save Session" context menu item
    chrome.contextMenus.create({
        id: "saveSession",
        title: "Quick Switch Login: Save Session for this Site",
        contexts: ["page"],
        documentUrlPatterns: ["http://*/*", "https://*/*"],
    });

    // Initialize default settings if not already set
    chrome.storage.local.get(["restrictionMode", "domainList"], (data) => {
        if (!data.restrictionMode) {
            chrome.storage.local.set({ restrictionMode: "blacklist" });
        }

        if (!data.domainList) {
            chrome.storage.local.set({ domainList: "" });
        }
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveSession") {
        // Get the domain from the tab URL
        const url = new URL(tab.url);
        const domain = url.hostname;

        // Check if the extension is enabled for this domain
        isExtensionEnabledForDomain(domain).then((enabled) => {
            if (!enabled) {
                // Notify the user that the extension is disabled for this domain
                chrome.tabs.sendMessage(tab.id, {
                    action: "showNotification",
                    message: `Quick Switch Login is disabled for ${domain}. You can enable it in the extension settings.`,
                    type: "warning",
                });
                return;
            }

            // Show popup to get session name
            chrome.storage.local.set(
                {
                    tempSaveData: {
                        domain,
                        tabId: tab.id,
                        defaultName: `Session for ${domain}`,
                    },
                },
                () => {
                    // Open the popup
                    chrome.action.openPopup();
                }
            );
        });
    }
});

// Check if the extension is enabled for a domain
async function isExtensionEnabledForDomain(domain) {
    const settings = await chrome.storage.local.get([
        "restrictionMode",
        "domainList",
    ]);

    if (!settings.restrictionMode || !settings.domainList) {
        return true; // Default to enabled if settings not found
    }

    const domainList = settings.domainList
        .split("\n")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

    const isDomainInList = domainList.some((d) => {
        // Support for wildcard domains (e.g., *.example.com)
        if (d.startsWith("*.")) {
            const baseDomain = d.substring(2);
            return domain.endsWith(baseDomain);
        }
        return d === domain;
    });

    // In blacklist mode, return true if domain is NOT in the list
    // In whitelist mode, return true if domain IS in the list
    return settings.restrictionMode === "blacklist"
        ? !isDomainInList
        : isDomainInList;
}

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle save session request
    if (request.action === "saveSession") {
        saveSession(request.domain, request.sessionName, request.tabId)
            .then((result) => sendResponse(result))
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true;
    }

    // Handle restore session request
    if (request.action === "restoreSession") {
        restoreSession(request.sessionId, request.tabId)
            .then((result) => sendResponse(result))
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true;
    }

    // Handle sync request
    if (request.action === "syncSessions") {
        syncSessions()
            .then((result) => sendResponse(result))
            .catch((error) =>
                sendResponse({ success: false, error: error.message })
            );
        return true;
    }

    // Handle check domain request
    if (request.action === "isExtensionEnabledForDomain") {
        isExtensionEnabledForDomain(request.domain)
            .then((enabled) => sendResponse({ enabled }))
            .catch((error) =>
                sendResponse({ enabled: true, error: error.message })
            );
        return true;
    }
});

// Save a session
async function saveSession(domain, sessionName, tabId) {
    try {
        // Get cookies for the domain
        const cookies = await chrome.cookies.getAll({ domain });

        // Get localStorage and sessionStorage via content script
        const storageData = await chrome.tabs.sendMessage(tabId, {
            action: "getStorageData",
        });

        // Create session object
        const session = {
            sessionId: generateId(),
            sessionName,
            websiteDomain: domain,
            websiteFaviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
            createdAt: new Date().toISOString(),
            cookies,
            localStorage: storageData.localStorage,
            sessionStorage: storageData.sessionStorage,
        };

        // Save session locally
        await saveSessionLocally(session);

        // Try to sync with backend if user is authenticated
        const authData = await chrome.storage.local.get(["authToken"]);
        if (authData.authToken) {
            try {
                await syncSessionToBackend(session);
            } catch (error) {
                console.error("Failed to sync session with backend:", error);
                // Add to sync queue
                await addToSyncQueue({ type: "save", session });
            }
        }

        return { success: true, session };
    } catch (error) {
        console.error("Failed to save session:", error);
        throw error;
    }
}

// Save a session to local storage
async function saveSessionLocally(session) {
    // Get existing sessions
    const data = await chrome.storage.local.get(["sessions"]);
    const sessions = data.sessions || [];

    // Add new session
    sessions.push(session);

    // Save to storage
    await chrome.storage.local.set({ sessions });
}

// Restore a session
async function restoreSession(sessionId, tabId) {
    try {
        // Get the session
        const data = await chrome.storage.local.get(["sessions"]);
        const sessions = data.sessions || [];
        const session = sessions.find((s) => s.sessionId === sessionId);

        if (!session) {
            throw new Error("Session not found");
        }

        // Get the tab URL
        const tab = await chrome.tabs.get(tabId);
        const url = new URL(tab.url);
        const domain = url.hostname;

        // Verify we're on the correct domain
        if (domain !== session.websiteDomain) {
            throw new Error(
                `Cannot restore session: current domain (${domain}) does not match session domain (${session.websiteDomain})`
            );
        }

        // Clear existing cookies for the domain
        const existingCookies = await chrome.cookies.getAll({ domain });
        for (const cookie of existingCookies) {
            await chrome.cookies.remove({
                url: `${cookie.secure ? "https" : "http"}://${cookie.domain}${
                    cookie.path
                }`,
                name: cookie.name,
            });
        }

        // Set cookies from the session
        for (const cookie of session.cookies) {
            // Skip cookies that can't be set (httpOnly cookies can be set but not read)
            if (cookie.hostOnly && cookie.domain.startsWith(".")) {
                continue;
            }

            try {
                await chrome.cookies.set({
                    url: `${cookie.secure ? "https" : "http"}://${
                        cookie.domain
                    }${cookie.path}`,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    expirationDate: cookie.expirationDate,
                });
            } catch (error) {
                console.error(`Failed to set cookie ${cookie.name}:`, error);
                // Continue with other cookies
            }
        }

        // Set localStorage and sessionStorage via content script
        await chrome.tabs.sendMessage(tabId, {
            action: "setStorageData",
            localStorage: session.localStorage,
            sessionStorage: session.sessionStorage,
        });

        return { success: true, session };
    } catch (error) {
        console.error("Failed to restore session:", error);
        throw error;
    }
}

// Sync sessions with the backend
async function syncSessions() {
    try {
        const authData = await chrome.storage.local.get(["authToken"]);
        if (!authData.authToken) {
            return { success: false, message: "Not authenticated" };
        }

        // Process sync queue first
        await processSyncQueue();

        // Get local sessions
        const data = await chrome.storage.local.get(["sessions"]);
        const localSessions = data.sessions || [];

        // Get remote sessions
        const remoteSessions = await fetchRemoteSessions();

        // Create maps for easier lookup
        const localSessionMap = new Map(
            localSessions.map((s) => [s.sessionId, s])
        );
        const remoteSessionMap = new Map(
            remoteSessions.map((s) => [s.sessionId, s])
        );

        // Sessions to add to local storage (remote sessions not in local)
        const sessionsToAdd = remoteSessions.filter(
            (s) => !localSessionMap.has(s.sessionId)
        );

        // Sessions to add to remote (local sessions not in remote)
        const sessionsToSync = localSessions.filter(
            (s) => !remoteSessionMap.has(s.sessionId)
        );

        // Add remote sessions to local storage
        if (sessionsToAdd.length > 0) {
            const newLocalSessions = [...localSessions, ...sessionsToAdd];
            await chrome.storage.local.set({ sessions: newLocalSessions });
        }

        // Sync local sessions to remote
        for (const session of sessionsToSync) {
            try {
                await syncSessionToBackend(session);
            } catch (error) {
                console.error("Failed to sync session to remote:", error);
                // Add to sync queue
                await addToSyncQueue({ type: "save", session });
            }
        }

        return {
            success: true,
            added: sessionsToAdd.length,
            synced: sessionsToSync.length,
        };
    } catch (error) {
        console.error("Failed to sync sessions:", error);
        throw error;
    }
}

// Fetch sessions from the backend
async function fetchRemoteSessions() {
    const authData = await chrome.storage.local.get(["authToken"]);
    if (!authData.authToken) {
        return [];
    }

    try {
        const response = await fetch("http://localhost:3000/api/sessions", {
            headers: {
                Authorization: `Bearer ${authData.authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch sessions from backend");
        }

        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error("Failed to fetch remote sessions:", error);
        return [];
    }
}

// Sync a session to the backend
async function syncSessionToBackend(session) {
    const authData = await chrome.storage.local.get(["authToken"]);
    if (!authData.authToken) {
        throw new Error("Not authenticated");
    }

    try {
        const response = await fetch("http://localhost:3000/api/sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authData.authToken}`,
            },
            body: JSON.stringify(session),
        });

        if (!response.ok) {
            throw new Error("Failed to sync session to backend");
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to sync session to backend:", error);
        throw error;
    }
}

// Add an operation to the sync queue
async function addToSyncQueue(operation) {
    const data = await chrome.storage.local.get(["syncQueue"]);
    const syncQueue = data.syncQueue || [];

    syncQueue.push(operation);
    await chrome.storage.local.set({ syncQueue });
}

// Process the sync queue
async function processSyncQueue() {
    const data = await chrome.storage.local.get(["syncQueue", "authToken"]);
    const syncQueue = data.syncQueue || [];

    if (syncQueue.length === 0 || !data.authToken) {
        return;
    }

    // Process each operation in the queue
    const newQueue = [];
    for (const operation of syncQueue) {
        try {
            switch (operation.type) {
                case "save":
                    await syncSessionToBackend(operation.session);
                    break;
                case "delete":
                    await deleteSessionFromBackend(operation.sessionId);
                    break;
                default:
                    // Unknown operation type, keep it in the queue
                    newQueue.push(operation);
            }
        } catch (error) {
            console.error("Failed to process sync operation:", error);
            // Keep failed operations in the queue
            newQueue.push(operation);
        }
    }

    // Update the queue
    await chrome.storage.local.set({ syncQueue: newQueue });
}

// Delete a session from the backend
async function deleteSessionFromBackend(sessionId) {
    const authData = await chrome.storage.local.get(["authToken"]);
    if (!authData.authToken) {
        throw new Error("Not authenticated");
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/sessions/${sessionId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authData.authToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete session from backend");
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to delete session from backend:", error);
        throw error;
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Set up periodic sync
chrome.alarms.create("syncSessions", { periodInMinutes: 30 });

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "syncSessions") {
        syncSessions().catch(console.error);
    }
});
