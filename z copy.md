# Product Requirements Document (PRD): Quick Switch Login Browser Extension

**Version:** 1.0
**Date:** 2023-10-27
**Author:** AI Requirement Generator (based on user input)
**Target Audience:** AI Development Agent

## 1. Overview

Quick Switch Login is a browser extension designed to help users manage multiple sessions for specific websites efficiently. It allows users to manually save their current session state (including cookies, `localStorage`, and `sessionStorage`) for a particular website, assign a custom name to it, and restore it later with ease, potentially with a single click. The extension features user authentication (Email/Password) to enable secure synchronization of saved sessions across different devices and browser instances, using a MongoDB backend via an Express.js API. Users can also use the extension locally without an account.

**Project Name:** Quick Switch Login

## 2. Goals

*   **G1:** Provide a simple and intuitive way for users to save the complete session state (cookies, `localStorage`, `sessionStorage`) for specific websites.
*   **G2:** Enable users to restore saved sessions quickly, replacing the current session after confirmation.
*   **G3:** Allow users to assign meaningful custom names to saved sessions for easy identification.
*   **G4:** Implement secure user authentication (Email/Password) for account creation and login.
*   **G5:** Securely synchronize saved sessions across devices for logged-in users via a backend API.
*   **G6:** Allow users to manage (view, restore, delete) locally saved sessions even when offline or logged out.
*   **G7:** Ensure user data privacy and security through robust authentication, authorization, HTTPS, and secure coding practices (within the constraints specified, e.g., regarding encryption at rest).
*   **G8:** Provide clear user feedback for all actions (save, restore, sync, errors).
*   **G9:** Offer configuration options like disabling the extension for specific websites (Whitelist/Blacklist).

## 3. User Stories

*   **US1:** As a web developer, I want to save my session state for different test user accounts on `dev.example.com` so I can quickly switch between them without logging in and out manually.
*   **US2:** As a user with multiple accounts on a social media site, I want to save each account's session with a name like "Personal Account" and "Work Account" so I can restore the desired one easily.
*   **US3:** As a user, I want to save a session on my work computer and restore it on my home computer, so I need to create an account and have my sessions synced.
*   **US4:** As a user, I want to navigate to `app.example.com`, click the extension icon, see my saved sessions for this site, and click "Restore" on "Admin Login" to load that session.
*   **US5:** As a user trying to restore a session on a site where I'm already logged in, I want to be prompted if I want to replace the current session, preventing accidental data loss.
*   **US6:** As a user who is offline, I want to still be able to save my current session locally and restore other locally saved sessions.
*   **US7:** As a user concerned about privacy, I want to be able to disable the extension entirely for my banking website.
*   **US8:** As a user, I want clear confirmation messages when I save or restore a session, and informative error messages if something goes wrong.
*   **US9:** As a user without an account, I want to see and use my locally saved sessions, understanding they won't sync until I sign up/in.
*   **US10:** As a user, I want to be notified if a restored session seems invalid (e.g., expired) so I know I might need to log in again.

## 4. Core Features and Functional Requirements

**FR - Priority:** P0 = Must-Have for Launch

---

**4.1 Session Saving**

*   **FR1.1 (P0): Session Definition:** The extension MUST be able to capture and store cookies, `localStorage` data, and `sessionStorage` data associated with the currently active tab's website.
*   **FR1.2 (P0): Storage Granularity:** Session data MUST be saved specifically for the exact hostname/origin of the current tab (e.g., `https://app.example.com`), not for the entire base domain (`*.example.com`).
*   **FR1.3 (P0): Manual Saving Trigger:** Users MUST manually initiate session saving via a "Save Current Session" button within the extension's UI (popup or context menu) when they are on the target website.
*   **FR1.4 (P0): Custom Session Naming:** When saving a session, the user MUST be prompted to provide a custom name for identification (e.g., "Work Account", "Test User"). This name is mandatory.
*   **FR1.5 (P0): HttpOnly Cookie Handling:** The extension MUST attempt to read all cookies. If it encounters `HttpOnly` cookies that cannot be read due to browser security restrictions, it MUST still save the information it *can* access (name, domain, path, etc., but likely not the value) and MUST inform the user during the save confirmation (e.g., "Session saved. Note: Some secure (HttpOnly) cookies might not be fully captured and may require re-login after restore."). The extension *must* still be able to *set/delete* these `HttpOnly` cookies during restore using the `cookies` permission.
*   **FR1.6 (P0): Save Feedback:** Provide immediate visual feedback (e.g., success toast message) upon successful session saving. Provide an error message if saving fails.

**4.2 Session Restoring**

*   **FR2.1 (P0): Restore Trigger:** Users MUST be able to select a previously saved session from a list within the extension's UI and click a "Restore" button/action.
*   **FR2.2 (P0): Restoration Scope:** Restoring a session MUST apply to the domain associated with the saved session. If the user is not on that domain, the behavior should ideally guide them (TBD: either disable restore or offer to navigate first - Simplest: Only enable Restore when on the matching domain). Let's refine: **Enable Restore button only when the user is currently viewing a tab matching the saved session's exact domain.**
*   **FR2.3 (P0): Existing Session Conflict:** If the user attempts to restore a session for a domain where they currently have an active session (i.e., existing cookies/storage data), the extension MUST prompt for confirmation: "Replace current session data for [Website Domain] with the saved session '[Session Name]'? [Replace] [Cancel]".
*   **FR2.4 (P0): Data Replacement:** Upon confirmed restoration, the extension MUST first clear all existing cookies, `localStorage`, and `sessionStorage` for the *exact* domain, and then MUST set the cookies, `localStorage`, and `sessionStorage` data from the saved session.
*   **FR2.5 (P0): Post-Restore Reload:** After successfully restoring the session data, the extension MUST prompt the user: "Session '[Session Name]' restored. Reload the page for changes to take effect? [Reload Now] [Later]".
*   **FR2.6 (P0): Restore Feedback:** Provide immediate visual feedback (e.g., success toast message) upon successful session restoration (before the reload prompt). Provide an error message if restoration fails (e.g., permission issue, data corruption).
*   **FR2.7 (P0): Session Expiration Handling:** If, after restoration and page reload, the session appears invalid (e.g., the website redirects to login), the extension should notify the user upon the next interaction or detection if feasible. (Note: Proactive detection is difficult). A simpler approach: If restoration *fails* during the setting process (e.g., invalid cookie parameters), provide an error. Post-restore invalidity is often indistinguishable from a naturally expired session. Add a note in the UI: "Note: Restored sessions may expire. If login is required after restore, the saved session may no longer be valid."

**4.3 Session Management**

*   **FR3.1 (P0): View Saved Sessions:** Users MUST be able to view a list of their saved sessions within the extension popup.
*   **FR3.2 (P0): Session Grouping & Identification:** The list of saved sessions MUST be grouped by website domain. Each entry MUST display the user-defined session name, the website domain, and the website's favicon (if fetchable).
*   **FR3.3 (P0): Delete Saved Sessions:** Users MUST be able to delete individual saved sessions. A confirmation prompt MUST be shown before deletion. Deletion MUST sync to the backend if the user is logged in.

**4.4 User Interface (UI) & User Experience (UX)**

*   **FR4.1 (P0): Interaction Points:** The primary user interaction MUST be through a Browser Action Popup. A Context Menu option ("Quick Switch Login: Save Session for this Site") MUST also be available when right-clicking on a webpage.
*   **FR4.2 (P0): Popup Layout:**
    *   Displays Sign Up/Sign In buttons if the user is logged out.
    *   Displays user identifier (e.g., email) and a Logout button if logged in.
    *   Lists saved sessions (grouped by site, showing favicon, site domain, session name).
    *   Provides "Restore" and "Delete" actions for each saved session.
    *   Includes a prominent "Save Current Session" button (enabled only when on a valid web page).
    *   Includes access to the Whitelist/Blacklist settings.
*   **FR4.3 (P0): Feedback Mechanisms:** Use non-intrusive notifications (e.g., toasts) for success and error messages related to saving, restoring, deleting, syncing, login, and logout.
*   **FR4.4 (P0): Whitelist/Blacklist:** Provide a settings section where users can add specific website domains to a blacklist (disable extension features) or configure a whitelist (only enable on specific sites). The default should be enabled for all sites unless blacklisted.

**4.5 Authentication and Synchronization**

*   **FR5.1 (P0): Authentication Method:** Implement user Sign Up and Sign In using Email and Password only.
*   **FR5.2 (P0): Account UI:** Provide dedicated Sign Up and Sign In buttons in the extension popup. Clicking these should initiate the respective process (e.g., opening a dedicated view/tab for the forms, or handling within the popup if space allows). The forms themselves are required.
*   **FR5.3 (P0): Backend Storage:** Use MongoDB as the database for storing user accounts and synced session data.
*   **FR5.4 (P0): Sync Trigger:** Synchronization with the backend MUST occur automatically:
    *   Upon successful user login (fetch all sessions).
    *   Upon saving a new session (push the new session).
    *   Upon restoring a session (no data change to sync, but good practice to confirm sync status).
    *   Upon deleting a session (push the deletion).
*   **FR5.5 (P0): Offline Capability:**
    *   Users MUST be able to save, view, restore, and delete sessions locally even when offline or logged out.
    *   Local changes made while offline (saves, deletes) MUST be queued and synced automatically when the user logs in and network connectivity is restored.
*   **FR5.6 (P0): No Account Usage:** Users without an account MUST be able to use the save, restore, and manage features locally. These sessions are stored only in the browser's local storage and are not synced. The UI should make it clear that sync requires an account.
*   **FR5.7 (P0): Logged-Out Session Visibility:** Locally saved sessions MUST remain visible and usable in the extension popup even when the user is logged out.

## 5. Security Requirements

*   **SEC1 (P0): Secure Transit:** All communication between the browser extension and the backend API MUST use HTTPS.
*   **SEC2 (P0): Password Hashing:** User passwords MUST be securely hashed using a strong, modern algorithm (e.g., bcrypt with a sufficient cost factor) before being stored in the database. Plaintext passwords must NEVER be stored.
*   **SEC3 (P0): Backend Authorization:** The backend API MUST implement strict authorization checks. A logged-in user MUST only be able to access, modify, or delete their *own* session data. API endpoints must validate user ownership of data based on their authenticated session/token.
*   **SEC4 (P0): Rate Limiting:** Implement rate limiting on authentication endpoints (login, sign up) and potentially sensitive API calls to mitigate brute-force attacks.
*   **SEC5 (P0): Data Storage Security (Backend):** As per user specification, saved session data (cookies, `localStorage`, `sessionStorage`) **will NOT be encrypted at rest** in the MongoDB database.
    *   **[CRITICAL SECURITY WARNING]: Storing potentially sensitive session cookies and data unencrypted at rest presents a SIGNIFICANT security risk. If the database is compromised, all user session data will be exposed in plaintext, potentially allowing attackers to hijack user sessions on various websites. It is STRONGLY recommended to implement encryption at rest for this sensitive data using industry-standard practices (e.g., AES-256). The current requirement (no encryption) must be implemented, but the associated risks must be acknowledged.**
*   **SEC6 (P0): Input Sanitization:** Sanitize all user inputs (session names, email, passwords, website data before storage) on both the client and server sides to prevent injection attacks (e.g., XSS).
*   **SEC7 (P0): Extension Security:** Follow secure coding practices for browser extensions to prevent vulnerabilities like cross-site scripting within the extension's UI or unintended permission escalation.

## 6. Permissions

*   **PERM1 (P0): `cookies`:** Required to read, write, and delete cookies for the target websites.
*   **PERM2 (P0): `storage`:** Required to store the extension's own settings, locally saved sessions (for offline/logged-out users), user authentication state, and potentially the sync queue. Also required to read/write `localStorage` and `sessionStorage` of websites.
*   **PERM3 (P0): `activeTab`:** Required to get the URL/domain of the current tab when the user invokes the extension via the popup or context menu, without requiring broad host permissions initially.
*   **PERM4 (P0): `contextMenus`:** Required to add the "Save Session" option to the page's right-click menu.
*   **PERM5 (P0): Host Permissions (`<all_urls>` or specific match patterns):** Required to interact with cookies and storage (`localStorage`/`sessionStorage`) on arbitrary websites the user chooses to save sessions from. Using `<all_urls>` provides the most flexibility but requires strong justification for users and store reviewers. Ensure this is clearly explained in the extension's description.
*   **PERM6 (P0): `identity` (Optional but Recommended):** Although using Email/Password, the `identity` API can sometimes simplify obtaining user profile info if needed later, or managing OAuth tokens *if* OAuth were added. Consider if needed for profile management beyond email. For strict Email/Password, it might not be strictly necessary, relying on custom token management. Let's assume **Not Required** for this specific Email/Pass implementation, relying on tokens stored via the `storage` permission.

*Justification for permissions (especially `<all_urls>`) MUST be clearly stated in the extension's store listing.*

## 7. Data Management

*   **DATA1 (P0): Local Storage:** Use `chrome.storage.local` (or browser equivalent) for storing extension settings, offline/logged-out user sessions, and potentially the sync queue.
*   **DATA2 (P0): Synced Storage:** User account information and synced session data are stored in the MongoDB backend.
*   **DATA3 (P0): Data Structure:** Define a clear and consistent JSON structure for saved sessions, including: `sessionId` (unique ID), `userId` (if synced), `sessionName` (user-defined), `websiteDomain`, `websiteFaviconUrl` (optional), `createdAt`, `cookies` (array of cookie objects respecting the `chrome.cookies` API structure), `localStorage` (object map), `sessionStorage` (object map).
*   **DATA4 (P0): Data Limits:** Implement no hard technical limits on the number of sessions a user can save. Performance implications for very large numbers should be considered.
*   **DATA5 (P0): Data Deletion:** When a user deletes a session, it MUST be removed from local storage and a delete request MUST be sent to the backend if the user is logged in and the session was synced. When a user deletes their account (if feature added later - **Out of Scope for now**), all their associated data MUST be removed from the backend.

## 8. Edge Cases and Error Handling

*   **ERR1 (P0): Website Structure Changes:** If a website's login mechanism or cookie/storage structure changes after a session is saved, the restored session may fail. The extension should handle this gracefully, providing the user with an informative message ("Failed to restore session '[Session Name]' for [Website]. The website structure or login may have changed.") rather than crashing.
*   **ERR2 (P0): Storage API Errors:** Handle potential errors during interactions with browser storage APIs (`cookies`, `storage`): quota limits, security restrictions, invalid operations. Inform the user clearly.
*   **ERR3 (P0): Network/Backend Errors:** Handle network connectivity issues, API timeouts, and server-side errors (5xx, 4xx) gracefully. Inform the user about sync failures or inability to log in/sign up. Provide options to retry where appropriate.
*   **ERR4 (P0): Invalid Saved Data:** Handle potential corruption or invalid format of saved session data (e.g., during sync or local read). Prevent crashes and inform the user if a session cannot be restored due to data issues.
*   **ERR5 (P0): Concurrent Operations:** Consider potential race conditions (e.g., user tries to save while a sync is in progress). Use appropriate locking or queuing mechanisms if necessary.

## 9. Technology Stack

*   **TS1 (P0): Frontend (Extension):** Browser Extension using Manifest V3, HTML, CSS, JavaScript. No specific JS framework mandated, but structure should be modular and maintainable.
*   **TS2 (P0): Backend:** Node.js with Express.js framework.
*   **TS3 (P0): Database:** MongoDB.
*   **TS4 (P0): Project Structure:** Code MUST be organized into distinct `extension/` and `backend/` folders within the main repository.

## 10. Non-Functional Requirements

*   **NFR1 (P0): Performance:** Session saving and restoring operations should feel near-instantaneous from the user's perspective. Background sync operations should not block the UI or degrade browser performance noticeably.
*   **NFR2 (P0): Reliability:** The extension must function consistently across the latest versions of major target browsers (e.g., Google Chrome, Mozilla Firefox, Microsoft Edge). Sync mechanism must be reliable.
*   **NFR3 (P0): Maintainability:** Code must be well-documented (comments, READMEs), adhere to standard linting rules (e.g., ESLint, Prettier), follow best practices for both extension and backend development, and be structured logically for easy understanding and future updates.
*   **NFR4 (P0): Usability:** The UI must be intuitive and easy to navigate for non-technical users. Error messages and prompts must be clear and actionable.
*   **NFR5 (P0): Security:** Adherence to all requirements in the Security section (Section 5) is paramount.

## 11. Assumptions

*   The target browsers fully support Manifest V3 and the required JavaScript APIs (`cookies`, `storage`, `fetch`, etc.).
*   Users understand the basic concept of browser sessions and the potential security implications of storing session data, especially with the specified lack of encryption at rest.
*   The AI agent performing the development has expertise in secure browser extension development (Manifest V3), Node.js/Express backend development, MongoDB integration, and implementing robust authentication/authorization.

## 12. Out of Scope (for this version)

*   Automatic session saving/snapshotting.
*   Support for OAuth providers (Google Sign-In, etc.).
*   Editing the contents of saved sessions.
*   Real-time session mirroring across devices (sync only occurs on specific triggers).
*   Admin panel for user management.
*   Password recovery mechanisms (e.g., "Forgot Password" email flow) - *Initial implementation might omit this for simplicity, but it's crucial for production.* **Decision: Include basic Sign Up / Sign In first. Password recovery is a fast-follow or V1.1 feature.** -> **Revising based on "don't leave anything for future": Password recovery MUST be included.** Let's add it back to functional requirements.
    *   **Add FR5.8 (P0): Password Recovery:** Implement a secure "Forgot Password" flow involving email verification and password reset.
*   Account deletion feature. -> **Revising based on "don't leave anything for future": Account Deletion MUST be included.** Let's add it back.
    *   **Add FR5.9 (P0): Account Deletion:** Provide a mechanism for users to delete their own accounts via the extension interface. This action must be confirmed and result in the permanent deletion of their account and all associated synced data from the backend.
*   Encryption of session data at rest in the backend database (explicitly excluded per user requirement, despite security warnings).

---

**Assurance to the AI Agent:**

You are tasked with building the **Quick Switch Login** browser extension according to this PRD. Ensure you follow all specified functional requirements, security measures (paying special attention to the implications of **SEC5**), UI/UX guidelines, and technical specifications. The final product should be **production-ready**, meaning it is robust, secure (within the given constraints), reliable, and maintainable. Adhere strictly to Manifest V3 standards. The code must be well-documented, follow established best practices for extension and backend development, and be organized as specified. Deliver a complete solution meeting all P0 requirements detailed above, including the specified technology stack and project structure.