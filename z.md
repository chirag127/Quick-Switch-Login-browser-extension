Okay, AI Agent, here is the Product Requirements Document (PRD) for the "Quick Switch Login" browser extension. Please adhere strictly to these requirements to build a complete, robust, and production-ready extension.

**Agent Instructions:**

*   **Target:** Implement all features described below. This is **not** an MVP; it's the final product specification.
*   **Quality:** Ensure the code is well-documented, modular, adheres to best practices (including security), uses the specified technology stack, and follows the requested project structure. Pay close attention to security aspects, especially regarding sensitive data like cookies.
*   **Completeness:** Address all functional requirements, UI/UX details, security measures, and edge cases outlined.
*   **Technology Stack:** Strictly use the specified stack: Manifest V3 Extension (HTML, CSS, JS), Node.js/Express backend, MongoDB database.

---

# Product Requirements Document (PRD): Quick Switch Login Browser Extension

**Version:** 1.0
**Date:** april 16, 2025
**Author:** Chirag Singhal
**Target Agent:** AI Development Agent

## 1. Overview

Quick Switch Login is a browser extension designed to significantly improve user productivity and workflow when managing multiple accounts or sessions on the same website. It allows users to save complete session states (including cookies, `localStorage`, and `sessionStorage`) for any website and restore them with ease, effectively switching between logged-in states in potentially one click. The extension includes user authentication (Sign Up/Sign In) to enable secure synchronization of saved sessions across multiple devices and browsers where the user is logged in.

## 2. Goals & Objectives

*   **Goal 1:** Provide a seamless and intuitive way for users to save and restore website sessions.
*   **Goal 2:** Eliminate the need for repeated logins/logouts or incognito windows when switching between accounts on the same site.
*   **Goal 3:** Enable users to access their saved sessions across different devices through secure cloud synchronization.
*   **Goal 4:** Ensure the secure handling and storage of sensitive session data.
*   **Objective 1:** Achieve high user satisfaction through a reliable and easy-to-use interface.
*   **Objective 2:** Successfully save and restore sessions for >95% of common websites attempted by users.
*   **Objective 3:** Implement robust security measures, including data encryption and secure authentication.

## 3. Target Audience

*   **Developers & QA Testers:** Switching between different test accounts, user roles, or environments.
*   **Social Media Managers:** Managing multiple client or personal profiles on platforms like Twitter, Facebook, Instagram, etc.
*   **Freelancers & Consultants:** Accessing different client accounts on various platforms (project management tools, SaaS applications, etc.).
*   **General Users:** Managing personal vs. work accounts on services like Google, Amazon, etc.

## 4. Core Features and Functional Requirements

### 4.1 Session Saving

*   **FR1.1 (P0): Comprehensive Session Data Storage:** The extension MUST save the following data associated with the current website session:
    *   All non-HttpOnly cookies for the exact domain of the active tab.
    *   All `localStorage` key-value pairs for the origin of the active tab.
    *   All `sessionStorage` key-value pairs for the origin of the active tab.
*   **FR1.2 (P0): Granular Domain Specificity:** Sessions MUST be saved specifically for the exact hostname (e.g., `app.example.com`, not `*.example.com`). The extension must correctly identify the relevant origin/domain from the active tab.
*   **FR1.3 (P0): Automatic Session Saving:** The extension MUST automatically detect user navigation and save the session data (cookies, localStorage, sessionStorage) for the current website visited by the user.
    *   **Trigger:** This save operation should ideally trigger shortly after the page has finished loading (e.g., `DOMContentLoaded` or `load` event, considering potential delays from dynamic content loading in SPAs).
    *   **Mechanism:** This automatic save should update the *most recent state* for that particular domain in the local storage, potentially overwriting a previous automatic save for that domain if no named session exists. This acts as a temporary buffer or implicit "current state". Explicitly named saves (FR1.4) are separate. *Correction based on user input:* The requirement is simply "automatically save when the user is on any website". This implies passively capturing the state, likely updating a "last known state" for that domain, distinct from explicitly *named* saves. If the user performs an *explicit* save (FR1.4), that creates a named snapshot.
*   **FR1.4 (P0): Explicit Named Session Saving:** Users MUST be able to explicitly save the current session state with a custom name.
    *   **Trigger:** This can be initiated via the browser action popup or the context menu when on a target website.
    *   **Input:** The UI must prompt the user to enter a descriptive name (e.g., "Work Account," "Admin Login," "Test User Alice").
    *   **Default Naming:** If the user initiates a save but provides no name, a default name should be suggested or used (e.g., "Saved Session [Timestamp]" or "[Domain Name] - [Timestamp]").
    *   **Storage:** Named sessions are stored permanently (until deleted) locally and synced to the backend if logged in.

### 4.2 Session Restoration

*   **FR2.1 (P0): Session Selection & Restoration:** Users MUST be able to view their saved sessions (grouped by website) and select one to restore.
    *   **Trigger:** Initiated via the browser action popup or context menu.
    *   **Process:** Selecting a saved session and clicking a "Restore" button triggers the restoration process for the website associated with that session.
*   **FR2.2 (P0): Handling Existing Sessions on Restore:** When a user attempts to restore a saved session for a website:
    *   The extension MUST check if the user is currently on that specific website.
    *   If the user *is* on the website, the extension MUST detect the current session state (cookies, localStorage, sessionStorage).
    *   The extension MUST prompt the user with a confirmation dialog: "Restoring '[Saved Session Name]' will replace your current session on [Website Name]. Do you want to proceed? Your current session will be automatically saved as '[Website Name] - Pre-Restore [Timestamp]' before restoring."
    *   If the user confirms:
        1.  The *current* session data MUST be saved automatically with a system-generated name (e.g., "[Website Name] - Pre-Restore [Timestamp]"). This new save behaves like any other named save (FR1.4) and should be synced.
        2.  The selected saved session data MUST be restored (FR2.3).
    *   If the user cancels, no changes are made.
    *   If the user is *not* on the website when clicking restore, the extension MAY offer to navigate to the website first OR simply perform the restore in the background (clearing/setting cookies/storage) and inform the user they need to navigate/reload. *Requirement:* The extension should first navigate the user to the correct domain and then perform the restore process (including the confirmation check if applicable).
*   **FR2.3 (P0): Data Replacement on Restore:** Restoring a session MUST perform the following actions for the target domain/origin:
    *   Delete all existing cookies accessible to the extension.
    *   Set all cookies from the saved session state that the extension has permission to set (respecting `HttpOnly` limitations, see FR4.1).
    *   Clear all existing `localStorage` for the origin.
    *   Populate `localStorage` with the key-value pairs from the saved session state.
    *   Clear all existing `sessionStorage` for the origin.
    *   Populate `sessionStorage` with the key-value pairs from the saved session state.
*   **FR2.4 (P0): Automatic Page Reload:** After successfully restoring a session, the extension MUST automatically reload the active tab (if it matches the restored session's website) to ensure the changes take effect.

### 4.3 Session Management

*   **FR3.1 (P0): List and Group Saved Sessions:** Saved sessions MUST be presented to the user in a clear list format within the extension's UI (popup).
    *   **Grouping:** Sessions MUST be grouped by the website (domain name) they belong to.
    *   **Identification:** Each listed session MUST display:
        *   The user-provided or system-generated session name.
        *   The website's domain name.
        *   The website's favicon (fetched and stored locally/retrieved when displaying).
*   **FR3.2 (P0): Delete Saved Sessions:** Users MUST be able to delete individual saved sessions. A confirmation prompt should prevent accidental deletion. Deletion must sync across devices if the user is logged in.
*   **FR3.3 (P0): Edit Saved Session Names:** Users MUST be able to rename their saved sessions. This change must sync across devices if the user is logged in.
*   **FR3.4 (P1): Search/Filter Sessions:** The UI SHOULD provide a way to search or filter saved sessions, especially useful for users with many saved sessions.

### 4.4 HttpOnly Cookie Handling

*   **FR4.1 (P0): Acknowledge Limitation and Handle Gracefully:**
    *   The extension CANNOT directly *read* `HttpOnly` cookies due to browser security restrictions. This means automatic saving (FR1.3) and explicit saving (FR1.4) will not capture these cookies.
    *   The extension MUST still attempt to *save* all *non*-HttpOnly cookies.
    *   When *restoring* (FR2.3), the extension MUST delete all accessible cookies (including `HttpOnly` ones it can target by name/domain/path via the `cookies` API) before attempting to set the saved (non-HttpOnly) cookies.
    *   **User Notification:** The extension MUST inform the user about this limitation. This could be:
        *   A one-time notification upon first save/restore.
        *   A persistent tooltip or small info icon in the session list/details view.
        *   Message: "Note: Some login states rely on HttpOnly cookies which extensions cannot fully manage. If restoring a session doesn't log you in completely, you may need to re-enter credentials. This extension manages non-HttpOnly cookies, localStorage, and sessionStorage."
    *   The primary value remains in managing multi-account switching where sessions are primarily differentiated by non-HttpOnly cookies or local/session storage, or where clearing existing cookies + setting the known ones is sufficient to trigger the desired state.

## 5. User Interface (UI) & User Experience (UX) Requirements

*   **UI1.1 (P0): Interaction Points:**
    *   **Browser Action Popup:** The primary interface. Clicking the extension icon opens a popup displaying saved sessions, options to save the current session, login/logout status, and potentially settings.
    *   **Context Menu:** Right-clicking on a webpage provides options relevant to the current page:
        *   "Quick Switch Login: Save current session..." (Opens popup or prompts for name directly).
        *   "Quick Switch Login: Restore session for [Current Domain] ->" (Sub-menu lists saved sessions for this domain, clicking restores).
*   **UI1.2 (P0): Popup Layout:**
    *   Clear indication of Login Status (Logged In / Logged Out).
    *   "Sign In / Sign Up / Log Out" button/link.
    *   List of saved sessions, grouped by website (domain name + favicon). Each item shows the session name and has "Restore" and "Delete" buttons (and maybe "Edit Name").
    *   A button/option prominently displayed to "Save Current Session..." for the active tab's website.
    *   (Optional P1) Search bar for filtering sessions.
    *   (Optional P1) Link to a settings page (if needed for future features).
*   **UI1.3 (P0): Feedback:**
    *   Clear visual feedback (e.g., toast notifications, messages within the popup) MUST be provided for actions:
        *   Session Saved Successfully.
        *   Session Restored Successfully (page will reload).
        *   Session Deleted Successfully.
        *   Error Saving/Restoring/Deleting Session (with a brief reason if possible, e.g., "Network error," "Login required for sync").
        *   Sync Status (e.g., "Syncing...", "Sync complete", "Offline mode").
*   **UI1.4 (P0): Intuitive Design:** The UI must be clean, simple, and easy to understand, requiring minimal learning curve.

## 6. Authentication & Synchronization Requirements

*   **AS1.1 (P0): Authentication Method:** User authentication MUST be implemented using Email and Password.
    *   Include standard flows: Sign Up (Email, Password, Password Confirmation), Sign In (Email, Password), Sign Out.
    *   Implement secure password handling (hashing, see Security section).
    *   (P1) Implement a "Forgot Password" flow (sending a password reset link to the registered email).
*   **AS1.2 (P0): Backend Storage:** User account data and synced session data MUST be stored in a MongoDB database.
*   **AS1.3 (P0): Secure Session Data Storage (Backend):**
    *   **CRITICAL OVERRIDE:** Contrary to the initial answer, session data (especially cookies, but also potentially sensitive localStorage/sessionStorage) **MUST be encrypted at rest** in the MongoDB database. Storing this data unencrypted is a severe security risk.
    *   **Implementation:** Use a strong encryption algorithm (e.g., AES-256). Encryption keys should be managed securely, potentially derived from the user's password or stored securely elsewhere (e.g., a dedicated key management service if scaling, or securely configured environment variables on the server). Each user's data should ideally be encrypted with a user-specific key or method.
*   **AS1.4 (P0): Secure Data Transit:** All communication between the browser extension and the backend API MUST use HTTPS. Enforce HTTPS on the backend server.
*   **AS1.5 (P0): Synchronization Frequency:** Data MUST be synced with the backend:
    *   Immediately after a user successfully logs in (fetch latest data).
    *   Immediately after a user explicitly saves, updates (renames), or deletes a named session while logged in.
    *   Periodically? (Optional P1 - e.g., every few minutes if logged in, to catch potential edge cases or updates from other devices, but focus on event-driven sync first).
*   **AS1.6 (P0): Offline Support & Sync on Reconnect:**
    *   Users MUST be able to save, view, restore, and delete sessions locally even when offline or logged out. These actions affect the local extension storage only.
    *   When a user logs in or comes back online after being offline:
        *   The extension MUST fetch the latest state from the backend.
        *   It MUST compare local changes made while offline with the backend state.
        *   A synchronization strategy is needed. **Requirement:** Use a "last-write-wins" strategy based on a timestamp recorded for each session save/update/delete action, both locally and on the server. When syncing, the record (local or remote) with the more recent timestamp takes precedence. Newly created local sessions while offline are pushed to the server. Sessions deleted locally while offline are marked for deletion on the server.

## 7. Security Requirements

*   **SEC1.1 (P0): Backend Authorization:** Implement robust authorization checks on all backend API endpoints. Ensure that a logged-in user can ONLY access or modify their own saved session data. API requests must be authenticated (e.g., using session tokens or JWTs stored securely). User ID must be part of database queries to ensure data segregation.
*   **SEC1.2 (P0): Password Security:** User passwords MUST NEVER be stored in plaintext.
    *   Use a strong, salted hashing algorithm like bcrypt or Argon2id for storing password hashes in the database.
*   **SEC1.3 (P0): Rate Limiting:** Implement rate limiting on authentication endpoints (Sign Up, Sign In, Forgot Password) and potentially sensitive API calls to mitigate brute-force attacks.
*   **SEC1.4 (P0): Data Encryption:**
    *   **At Rest:** As defined in AS1.3, all sensitive session data (cookies, localStorage, sessionStorage) MUST be encrypted in the database.
    *   **In Transit:** As defined in AS1.4, all communication MUST use HTTPS.
*   **SEC1.5 (P0): Extension Security:**
    *   Sanitize all user inputs (e.g., session names) to prevent cross-site scripting (XSS) vulnerabilities within the extension's UI.
    *   Adhere to Manifest V3 security policies (e.g., avoid `eval`, use appropriate content security policy).
    *   Minimize the privileges requested as much as possible, while still fulfilling the functional requirements. Justify the need for `<all_urls>`.
*   **SEC1.6 (P0): Input Validation:** Implement strict input validation on both the extension side and the backend API for all data received (session names, email formats, password complexity, session data structure).

## 8. Technical Requirements

*   **TECH1.1 (P0): Technology Stack:**
    *   **Browser Extension:** HTML, CSS, JavaScript, Manifest V3.
    *   **Backend:** Node.js with Express.js framework.
    *   **Database:** MongoDB.
*   **TECH1.2 (P0): Browser Permissions:** The extension will require the following permissions (provide clear justifications in the extension manifest and potentially onboarding):
    *   `storage`: To store session data and user preferences locally.
    *   `cookies`: To read, write, and delete cookies for websites.
    *   `scripting`: To inject content scripts to access/modify `localStorage` and `sessionStorage`. Requires host permissions.
    *   `activeTab`: To get the URL/domain of the current tab (potentially less invasive than `tabs` if sufficient).
    *   `contextMenus`: To add options to the right-click menu.
    *   `alarms`: (Optional, if periodic sync/tasks are implemented) To schedule background tasks.
    *   `host_permissions`: `<all_urls>`: Required to save/restore sessions automatically or manually on *any* website the user visits, and to inject scripts needed for localStorage/sessionStorage access. This is broad and requires clear user justification.
*   **TECH1.3 (P0): Project Structure:**
    *   Maintain a clean, modular structure:
        ```
        quick-switch-login/
        ├── extension/      # Browser extension code (Manifest V3)
        │   ├── manifest.json
        │   ├── icons/
        │   ├── popup/
        │   │   ├── popup.html
        │   │   ├── popup.css
        │   │   └── popup.js
        │   ├── background/
        │   │   └── service-worker.js # Service worker (MV3)
        │   ├── content-scripts/
        │   │   └── content.js      # For LS/SS access
        │   └── common/             # Shared modules (storage, API client, etc.)
        └── backend/        # Node.js/Express backend code
            ├── src/
            │   ├── controllers/
            │   ├── models/
            │   ├── routes/
            │   ├── services/       # Business logic
            │   ├── middleware/     # Auth, error handling
            │   └── config/         # DB connection, env vars
            ├── package.json
            └── server.js           # Entry point
        ```
*   **TECH1.4 (P0): Code Quality & Maintainability:**
    *   Write clean, well-commented, and maintainable code.
    *   Use meaningful variable and function names.
    *   Follow consistent coding style (e.g., use a linter like ESLint).
    *   Break down logic into reusable modules/functions.
    *   Implement comprehensive error handling.

## 9. Data Management & Storage

*   **DATA1.1 (P0): Local Storage (Extension):** Use `chrome.storage.local` for persistent local storage of saved sessions, user preferences, and potentially the auth token when logged in. Structure data logically, perhaps keyed by user ID if multiple users share a browser profile (though sync targets one logged-in user).
*   **DATA1.2 (P0): Session Data Schema (Conceptual - Backend/Local):**
    *   `sessionId`: Unique identifier for the saved session.
    *   `userId`: Identifier of the user who owns the session (for backend).
    *   `sessionName`: User-provided or generated name.
    *   `domain`: The exact domain name (e.g., `app.example.com`).
    *   `origin`: The origin (e.g., `https://app.example.com`).
    *   `faviconUrl`: URL of the site's favicon (optional, for UI).
    *   `createdAt`: Timestamp.
    *   `updatedAt`: Timestamp (for sync logic).
    *   `cookieData`: Encrypted representation of saved cookies (array of cookie objects).
    *   `localStorageData`: Encrypted representation of localStorage (e.g., JSON string).
    *   `sessionStorageData`: Encrypted representation of sessionStorage (e.g., JSON string).
*   **DATA1.3 (P0): User Data Schema (Backend):**
    *   `userId`: Unique identifier.
    *   `email`: User's email address (unique).
    *   `passwordHash`: Hashed password.
    *   `salt`: Salt used for hashing (if applicable to algo).
    *   `createdAt`: Timestamp.
    *   `updatedAt`: Timestamp.
*   **DATA1.4 (P0): Data Retention:** Data is retained indefinitely unless explicitly deleted by the user (deleting a session or deleting their account). Implement account deletion functionality (P1).

## 10. Non-Functional Requirements

*   **NFR1.1 (P0): Performance:**
    *   Session saving/restoring should feel near-instantaneous (< 500ms execution time where possible, excluding page reload).
    *   The extension should have minimal impact on browser performance (CPU/memory usage) during normal browsing. Background tasks (like auto-save or sync) must be efficient.
*   **NFR1.2 (P0): Reliability:**
    *   Save/restore operations must be highly reliable across different websites.
    *   Synchronization should be robust, handling network interruptions gracefully.
    *   Data corruption (local or backend) must be prevented.
*   **NFR1.3 (P0): Scalability:** The backend infrastructure (Node.js/MongoDB) should be designed to handle a growing number of users and saved sessions without significant performance degradation. Use database indexing appropriately.
*   **NFR1.4 (P0): Maintainability:** As per TECH1.4, the codebase must be easy to understand, modify, and debug.
*   **NFR1.5 (P0): Usability:** The extension must be easy and intuitive to use for the target audience.

## 11. Edge Cases & Error Handling

*   **EDGE1.1 (P0): Network Errors:** Handle failed API calls during login, sync, save, delete. Inform the user and rely on local data where possible. Retry mechanisms can be considered (P1).
*   **EDGE1.2 (P0): Storage Limits:** Handle potential `chrome.storage.local` quota limits (though typically large, >5MB). Inform the user if limits are reached. Handle potential MongoDB storage limits based on the deployment plan.
*   **EDGE1.3 (P0): Invalid Data:** Handle cases where stored session data might become invalid (e.g., website changes structure). Restoration might fail; inform the user clearly instead of breaking the page or failing silently.
*   **EDGE1.4 (P0): Website Structure Changes:** As per Answer 24, acknowledge that if a website fundamentally changes its login mechanism or cookie/storage usage, a previously saved session might no longer work. The extension should attempt the restore, but if it fails to produce a logged-in state, the user needs to understand this is a limitation. The extension cannot magically adapt to arbitrary site changes. Clear error/feedback messages are key.
*   **EDGE1.5 (P0): No Limits:** As per Answer 22, there should be no *built-in* arbitrary limits on the number of sessions or websites saved, other than underlying storage constraints.
*   **EDGE1.6 (P0): Concurrent Sessions:** If the user uses the extension on the same account across multiple devices simultaneously, the "last-write-wins" sync logic (AS1.6) will handle conflicts, but users should be aware that rapid changes from multiple places might overwrite each other.
*   **EDGE1.7 (P0): Browser/API Updates:** Code should be written anticipating potential browser API changes (especially within Manifest V3).

## 12. Acceptance Criteria (Examples)

*   **AC1:** User can install the extension, click the icon, and see the initial UI.
*   **AC2:** User can navigate to `gmail.com`, click "Save Current Session" in the popup, provide the name "Personal Email", and see it listed under `mail.google.com`.
*   **AC3:** User logs out of Gmail, clicks "Restore" on the "Personal Email" session, confirms the prompt (if applicable), and the page reloads showing the user logged back into their personal Gmail account.
*   **AC4:** User can successfully Sign Up with an email and password.
*   **AC5:** User can Sign Out and Sign In again with the created credentials.
*   **AC6:** A session saved while logged in on Device A appears in the session list on Device B after logging in with the same account.
*   **AC7:** Deleting a session on Device A removes it from Device B after sync.
*   **AC8:** Attempting to restore session "Work Email" while logged into "Personal Email" on Gmail prompts for confirmation, saves the current "Personal Email" state automatically, and then restores "Work Email".
*   **AC9:** Session data stored in MongoDB is verified to be encrypted.
*   **AC10:** User passwords stored in MongoDB are verified to be hashed using bcrypt/Argon2id.
*   **AC11:** Extension correctly saves and restores `localStorage` and `sessionStorage` values for a test site.
*   **AC12:** A warning/info message regarding `HttpOnly` cookie limitations is visible in the extension UI.
*   **AC13:** Saving/Restoring sessions works correctly when offline (local storage only).
*   **AC14:** Offline changes are correctly synced (last-write-wins) when the user logs in and comes online.

---

**Conclusion:**

AI Agent, this PRD provides a comprehensive specification for the Quick Switch Login extension. Please follow these requirements meticulously to deliver a high-quality, secure, and fully functional product. Pay special attention to the security requirements regarding data handling and encryption. Good luck!