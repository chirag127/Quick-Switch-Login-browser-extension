import { auth, sessions } from "../js/api.js";
import {
    getDomain,
    getFaviconUrl,
    generateDefaultSessionName,
    saveCurrentSession,
    getLocalSessions,
    getLocalSessionsByDomain,
    deleteLocalSession,
    restoreSession,
    syncSessions,
} from "../js/session.js";
import {
    showNotification,
    formatDate,
    groupSessionsByDomain,
    isValidUrl,
    confirmAction,
    promptUser,
} from "../js/utils.js";

// DOM Elements
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const logoutButton = document.getElementById("logout-button");
const userEmail = document.getElementById("user-email");
const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const saveSessionButton = document.getElementById("save-session-button");
const currentSiteDomain = document.getElementById("current-site-domain");
const currentSiteFavicon = document.getElementById("current-site-favicon");
const sessionsList = document.getElementById("sessions-list");
const syncStatus = document.getElementById("sync-status");
const syncMessage = document.getElementById("sync-message");

// Current tab information
let currentTab = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Get current tab
        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        currentTab = tabs[0];

        // Check if URL is valid for session management
        if (currentTab && currentTab.url && isValidUrl(currentTab.url)) {
            const domain = getDomain(currentTab.url);
            currentSiteDomain.textContent = domain;
            currentSiteFavicon.style.backgroundImage = `url(${getFaviconUrl(
                domain
            )})`;
            saveSessionButton.disabled = false;
        } else {
            currentSiteDomain.textContent =
                "Not a valid page for session management";
            saveSessionButton.disabled = true;
        }

        // Check authentication status
        const isLoggedIn = await auth.isLoggedIn();
        updateAuthUI(isLoggedIn);

        if (isLoggedIn) {
            // Get user info
            try {
                const user = await auth.getCurrentUser();
                userEmail.textContent = user.email;

                // Sync sessions
                await syncSessions();
                syncMessage.textContent = "Sessions synced with cloud";
                syncStatus.classList.remove("hidden");
            } catch (error) {
                console.error("Error getting user info:", error);
                // If token is invalid, log out
                if (error.message.includes("Token is not valid")) {
                    await auth.logout();
                    updateAuthUI(false);
                }
            }
        } else {
            syncMessage.textContent =
                "Sign in to sync your sessions across devices";
            syncStatus.classList.remove("hidden");
        }

        // Load sessions
        await loadSessions();
    } catch (error) {
        console.error("Error initializing popup:", error);
        showNotification(`Error initializing: ${error.message}`, "error");
    }
});

// Auth UI event listeners
loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
});

signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
});

// Login form submission
loginButton.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showNotification("Please enter both email and password", "error");
        return;
    }

    try {
        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";

        await auth.login(email, password);

        showNotification("Logged in successfully", "success");
        updateAuthUI(true);

        // Get user info
        const user = await auth.getCurrentUser();
        userEmail.textContent = user.email;

        // Sync sessions
        await syncSessions();
        syncMessage.textContent = "Sessions synced with cloud";

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Login error:", error);
        showNotification(`Login failed: ${error.message}`, "error");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});

// Signup form submission
signupButton.addEventListener("click", async () => {
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById(
        "signup-confirm-password"
    ).value;

    if (!email || !password || !confirmPassword) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
    }

    try {
        signupButton.disabled = true;
        signupButton.textContent = "Signing up...";

        await auth.signup(email, password);

        showNotification("Account created successfully", "success");
        updateAuthUI(true);

        // Get user info
        const user = await auth.getCurrentUser();
        userEmail.textContent = user.email;

        // Sync sessions
        await syncSessions();
        syncMessage.textContent = "Sessions synced with cloud";

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Signup error:", error);
        showNotification(`Signup failed: ${error.message}`, "error");
    } finally {
        signupButton.disabled = false;
        signupButton.textContent = "Sign Up";
    }
});

// Logout button
logoutButton.addEventListener("click", async () => {
    try {
        await auth.logout();
        showNotification("Logged out successfully", "success");
        updateAuthUI(false);
        syncMessage.textContent =
            "Sign in to sync your sessions across devices";

        // Reload sessions (now showing only local ones)
        await loadSessions();
    } catch (error) {
        console.error("Logout error:", error);
        showNotification(`Logout failed: ${error.message}`, "error");
    }
});

// Save session button
saveSessionButton.addEventListener("click", async () => {
    if (!currentTab || !currentTab.url || !isValidUrl(currentTab.url)) {
        showNotification("Cannot save session for this page", "error");
        return;
    }

    try {
        const domain = getDomain(currentTab.url);
        const defaultName = generateDefaultSessionName(domain);
        const sessionName = await promptUser(
            "Enter a name for this session:",
            defaultName
        );

        if (!sessionName) return; // User cancelled

        saveSessionButton.disabled = true;
        saveSessionButton.textContent = "Saving...";

        await saveCurrentSession(currentTab.id, currentTab.url, sessionName);

        showNotification(
            `Session "${sessionName}" saved successfully`,
            "success"
        );

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error saving session:", error);
        showNotification(`Error saving session: ${error.message}`, "error");
    } finally {
        saveSessionButton.disabled = false;
        saveSessionButton.textContent = "Save Current Session";
    }
});

// Update authentication UI
const updateAuthUI = (isLoggedIn) => {
    if (isLoggedIn) {
        loggedOut.classList.add("hidden");
        loggedIn.classList.remove("hidden");
    } else {
        loggedIn.classList.add("hidden");
        loggedOut.classList.remove("hidden");
        userEmail.textContent = "";
    }
};

// Load sessions
const loadSessions = async () => {
    try {
        // Get all sessions
        const allSessions = await getLocalSessions();

        // Group sessions by domain
        const groupedSessions = groupSessionsByDomain(allSessions);

        // Clear sessions list
        sessionsList.innerHTML = "";

        // If no sessions, show message
        if (allSessions.length === 0) {
            sessionsList.innerHTML =
                '<div class="no-sessions">No saved sessions</div>';
            return;
        }

        // Create domain groups
        for (const [domain, domainSessions] of Object.entries(
            groupedSessions
        )) {
            const domainGroup = document.createElement("div");
            domainGroup.className = "domain-group";

            // Create domain header
            const domainHeader = document.createElement("div");
            domainHeader.className = "domain-header";

            const domainFavicon = document.createElement("div");
            domainFavicon.className = "domain-favicon";
            domainFavicon.style.backgroundImage = `url(${getFaviconUrl(
                domain
            )})`;

            const domainName = document.createElement("div");
            domainName.className = "domain-name";
            domainName.textContent = domain;

            domainHeader.appendChild(domainFavicon);
            domainHeader.appendChild(domainName);
            domainGroup.appendChild(domainHeader);

            // Create session items
            domainSessions.forEach((session) => {
                const sessionItem = document.createElement("div");
                sessionItem.className = "session-item";

                const sessionName = document.createElement("div");
                sessionName.className = "session-name";
                sessionName.textContent = session.name;

                const sessionActions = document.createElement("div");
                sessionActions.className = "session-actions";

                // Restore button
                const restoreButton = document.createElement("button");
                restoreButton.className = "session-action restore";
                restoreButton.textContent = "Restore";
                restoreButton.addEventListener("click", async () => {
                    await handleRestoreSession(session);
                });

                // Delete button
                const deleteButton = document.createElement("button");
                deleteButton.className = "session-action delete";
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", async () => {
                    await handleDeleteSession(session);
                });

                sessionActions.appendChild(restoreButton);
                sessionActions.appendChild(deleteButton);

                sessionItem.appendChild(sessionName);
                sessionItem.appendChild(sessionActions);

                domainGroup.appendChild(sessionItem);
            });

            sessionsList.appendChild(domainGroup);
        }
    } catch (error) {
        console.error("Error loading sessions:", error);
        showNotification(`Error loading sessions: ${error.message}`, "error");
    }
};

// Handle restore session
const handleRestoreSession = async (session) => {
    try {
        // Check if current tab is on the same domain
        if (
            !currentTab ||
            !currentTab.url ||
            getDomain(currentTab.url) !== session.domain
        ) {
            showNotification(
                `Please navigate to ${session.domain} to restore this session`,
                "error"
            );
            return;
        }

        // Confirm restoration
        const confirmed = await confirmAction(
            `Replace current session for ${session.domain} with "${session.name}"?`
        );

        if (!confirmed) return; // User cancelled

        // Restore session
        await restoreSession(currentTab.id, currentTab.url, session);

        showNotification(
            `Session "${session.name}" restored successfully`,
            "success"
        );

        // Ask if user wants to reload the page
        const reload = await confirmAction(
            "Session restored. Reload the page for changes to take effect?"
        );

        if (reload) {
            chrome.tabs.reload(currentTab.id);
        }
    } catch (error) {
        console.error("Error restoring session:", error);
        showNotification(`Error restoring session: ${error.message}`, "error");
    }
};

// Handle delete session
const handleDeleteSession = async (session) => {
    try {
        // Confirm deletion
        const confirmed = await confirmAction(
            `Delete session "${session.name}" for ${session.domain}?`
        );

        if (!confirmed) return; // User cancelled

        // Delete session
        await deleteLocalSession(session.id);

        showNotification(
            `Session "${session.name}" deleted successfully`,
            "success"
        );

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error deleting session:", error);
        showNotification(`Error deleting session: ${error.message}`, "error");
    }
};
