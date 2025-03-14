// Version 1.2.9
/**
 * LOGIN
 */

// Error Messages
const genericErrorMessage = "Unable to login.";
const clientErrorMessage = "Cannot access client.";
const privateErrorMessage = "Please use a non-private window.";

// DriveWorks Live Client
let client = null;

/**
 * Display login error message.
 *
 * @param {string} message - The error message to display.
 * @param {Object} [error] - The error object (optional).
 */
function loginError(message, error) {
    console.log("Login error:", message, error);
    if (error) {
        console.error(error);
    }
}

/**
 * On page load.
 */
(async function () {
    // Check localStorage support (show warning if not e.g. <= iOS 10 Private Window)
    if (!localStorageSupported()) {
        removeSkeleton();
        loginError(privateErrorMessage);
        return;
    }
})();

/**
 * Create client.
 */
async function dwClientLoaded() {
    console.log("DriveWorks client library loaded");
    
    try {
        if (window.DriveWorksLiveClient) {
            client = new window.DriveWorksLiveClient(config.serverUrl);
            console.log("DriveWorksLiveClient initialized with server URL:", config.serverUrl);
        } else {
            console.log("DriveWorksLiveClient not available");
            return;
        }
    } catch (error) {
        console.log("Error initializing DriveWorksLiveClient:", error);
        loginError(clientErrorMessage, error);
        removeSkeleton();
        return;
    }

    // Quick Logout (?bye)
    const URL_QUERY = new URLSearchParams(window.location.search);
    if (URL_QUERY.has("bye")) {
        console.log("Logout parameter detected, forcing logout");
        await forceLogout();
        return;
    }

    // Check for existing session
    const existingSession = localStorage.getItem("sessionId");
    if (existingSession) {
        console.log("Found existing session:", existingSession);
        client._sessionId = existingSession;
    }

    if (client == null) {
        console.log("Client is null, calling dwClientLoadError");
        dwClientLoadError();
    } else {
        console.log("Client initialized successfully, starting page functions");
        startPageFunctions();
    }
}

/**
 * Start page functions.
 */
function startPageFunctions() {
    try {
        login("default");
    } catch (error) {
        handleGenericError(error);
    }
}

async function login(type) {
    console.log("Login function called with type:", type);
    
    // Show error if cannot connect to client
    if (!client) {
        console.log("Client not available, attempting to create");
        try {
            client = new window.DriveWorksLiveClient(config.serverUrl);
        } catch (error) {
            console.log("Failed to create client:", error);
            loginError(clientErrorMessage);
            return;
        }
    }

    try {
        let result = null;
        let inputUsername = null;
        
        // Start Session
        if (type === "default" || type === null || type === "") {
            const groupAlias = config.groupAlias;
            console.log("Attempting login with blank credentials to group:", groupAlias);
            const userCredentials = {
                username: "",
                password: "",
            };
            result = await client.loginGroup(groupAlias, userCredentials);
        }

        // Show error if login failed
        if (!result) {
            console.log("Login failed - no result returned");
            loginError(genericErrorMessage);
            return;
        }

        console.log("Login successful, session ID:", result.sessionId);
        loginSuccess(result, inputUsername);
    } catch (error) {
        console.log("Login error:", error);
        loginError(genericErrorMessage, error);
    }
}

function handleLoginForm(event) {
    event.preventDefault();
    login("default", event);
}

function removeSkeleton() {
    // Safely remove skeleton classes from elements if they exist
    const elements = [
        { selector: '.login-button' },
        { selector: '.login-sso-button' },
        { selector: '.login-guest' },
        { selector: '.create-account-button' }
    ];
    
    elements.forEach(element => {
        const el = document.querySelector(element.selector);
        if (el) {
            el.classList.remove("skeleton-block");
        }
    });
    
    console.log("Skeleton elements removed");
}

/**
 * Handle successful login. Store Session data to localStorage
 */
function loginSuccess(result, username) {
    console.log("Storing session data to localStorage");
    // Store session details to localStorage
    localStorage.setItem("sessionId", result.sessionId);
    
    // Use the group alias from config
    localStorage.setItem("sessionAlias", config.groupAlias);
    
    // Store username or set as Guest
    if (username) {
        localStorage.setItem("sessionUsername", username);
    } else {
        localStorage.setItem("sessionUsername", "Guest");
    }
}

/**
 * Check existing login. Automatically login if found.
 */
async function checkExistingLogin() {
    const storedGroupAlias = localStorage.getItem("sessionAlias");

    if (!storedGroupAlias) {
        return;
    }

    try {
        // Test connection
        await client.getProjects(storedGroupAlias, "$top=1");
    } catch (error) {
        handleGenericError(error);
    }
}

/**
 * Force logout and session data clearing.
 */
async function forceLogout() {
    // Logout from all Groups.
    try {
        await client.logoutAllGroups();
    } catch (error) {
        handleGenericError(error);
    }

    // Clear session information from storage.
    localStorage.clear();

    // Show login screen message.
    setLoginNotice("You have been logged out.", "success");
}

/**
 * Check for localStorage support - used to store session information.
 * Example: Incognito (Private) windows in iOS 10 and below do not allow localStorage, errors when accessed.
 */
function localStorageSupported() {
    try {
        localStorage.setItem("storageSupportTest", "Test");
        localStorage.removeItem("storageSupportTest");
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Set login screen notice.
 *
 * @param {string} text - The text displayed to the user on the login screen.
 * @param {string} [state] - The type of message state (error/success/info).
 */
function setLoginNotice(text, state = "info") {
    const notice = JSON.stringify({ text, state });
    localStorage.setItem("loginNotice", notice);
}

/**
 * Handle generic errors e.g. tryCatch.
 *
 * @param {Object} error - The error object.
 */
function handleGenericError(error) {
    console.log(error);
}

/**
 * DriveWorks Live client library load error.
 */
function dwClientLoadError() {
    loginError(clientErrorMessage);
    removeSkeleton();
}

