// Version 1.2.2
/**
 * SHARED CORE PAGE FUNCTIONS
 */

// Get session information from localStorage
const CURRENT_SESSION = localStorage.getItem("sessionId");

// Global client variable - initialized in login.js
if (typeof client === 'undefined') {
    var client = null;
}

/**
 * Run on page load.
 */
; (() => {
    // Check if Session Id exists
    checkStoredSessionId();
    showUsername();
    attachLogoutActions();
    detectTouchDevice();
    handleMobileNavigationToggle();
    setLogo();
})();

/**
 * Set the logo image from config
 */
function setLogo() {
    try {
        const logoImg = document.getElementById("logo");
        if (logoImg && config.images && config.images.sidebar) {
            logoImg.src = config.images.sidebar;
            console.log("Logo set to:", config.images.sidebar);
        } else {
            console.log("Logo element or config not found");
        }
    } catch (error) {
        console.log("Error setting logo:", error);
    }
}

/**
 * Check Session Id exists locally.
 */
async function checkStoredSessionId() {
    // If no session is stored (e.g. not logged in), try to login
    if (CURRENT_SESSION === null || CURRENT_SESSION === "undefined") {
        console.log("No session found, attempting automatic login");
        
        // Try to use login function from login.js if it exists
        if (typeof login === 'function') {
            try {
                console.log("Using login function from login.js");
                login("default");
                return;
            } catch (error) {
                console.log("Error calling login function:", error);
                // Continue with fallback login method
            }
        }

        // Make sure client is initialized
        if (!client && window.DriveWorksLiveClient) {
            console.log("Initializing DriveWorksLiveClient");
            try {
                client = new window.DriveWorksLiveClient(config.serverUrl);
            } catch (error) {
                console.log("Error initializing client:", error);
                return;
            }
        }

        if (client) {
            try {
                console.log("Attempting automatic login with blank credentials");
                const result = await client.loginGroup(config.groupAlias, { username: "", password: "" });
                
                if (result) {
                    console.log("Automatic login successful, session ID:", result.sessionId);
                    // Store session details to localStorage
                    localStorage.setItem("sessionId", result.sessionId);
                    localStorage.setItem("sessionAlias", config.groupAlias);
                    localStorage.setItem("sessionUsername", "Guest");

                    // Refresh the page to apply the new session
                    window.location.reload();
                } else {
                    // If login fails, continue without redirecting
                    console.log("Automatic login failed, but continuing without redirection");
                }
            } catch (error) {
                console.log("Error during automatic login:", error);
            }
        } else {
            console.log("Client not available for automatic login");
        }
    } else {
        console.log("Using existing session:", CURRENT_SESSION);
    }
}

/**
 * Add generic client error handling for unauthorized users.
 */
async function setCustomClientErrorHandler() {
    if (client) {
        client.responseErrorDelegate = (res) => {
            if (res.status == 401) {
                handleUnauthorizedUser();
            }
        };
    }
}

/**
 * Call login function instead of redirecting to login screen.
 *
 * @param {string} notice - The text displayed to the user on the login screen.
 * @param {string} state - The type of message state (error/success/info).
 * @param {boolean} [noReturnUrl] - Optionally disable return url
 */
function redirectToLogin(notice, state, noReturnUrl) {
    console.log("Redirecting to login with notice:", notice);
    
    // Clear Session from storage
    localStorage.clear();

    // Store login screen message
    if (notice && state) {
        setLoginNotice(notice, state);
    }

    // Call login function from login.js if it exists
    if (typeof login === 'function') {
        console.log("Using login function from login.js");
        login("default");
    } else {
        console.log("Using fallback automatic login");
        // Fallback to automatic login with blank credentials
        try {
            if (!client && window.DriveWorksLiveClient) {
                console.log("Initializing DriveWorksLiveClient");
                client = new window.DriveWorksLiveClient(config.serverUrl);
            }

            if (client) {
                console.log("Attempting automatic login with blank credentials");
                client.loginGroup(config.groupAlias, { username: "", password: "" })
                    .then(result => {
                        if (result) {
                            console.log("Automatic login successful, session ID:", result.sessionId);
                            // Store session details to localStorage
                            localStorage.setItem("sessionId", result.sessionId);
                            localStorage.setItem("sessionAlias", config.groupAlias);
                            localStorage.setItem("sessionUsername", "Guest");

                            // Save current URL for potential return after login
                            const currentUrl = window.location.href;
                            if (!noReturnUrl && config.loginReturnUrls) {
                                localStorage.setItem("returnUrl", currentUrl);
                            }

                            // Refresh the page to apply the new session
                            window.location.reload();
                        } else {
                            console.log("Automatic login failed");
                        }
                    })
                    .catch(error => {
                        console.log("Error during automatic login:", error);
                    });
            } else {
                console.log("Client not available for automatic login");
            }
        } catch (error) {
            console.log("Error during automatic login:", error);
        }
    }
}

/**
 * Attach logout actions.
 */
function attachLogoutActions() {
    const logoutButtons = document.getElementsByClassName("logout-button");
    if (!logoutButtons || logoutButtons.length === 0) {
        return;
    }

    for (const logoutButton of logoutButtons) {
        logoutButton.addEventListener("click", handleLogout);
    }
}

/**
 * Redirect on logout.
 */
function logoutRedirect() {
    // Clear Session from storage
    localStorage.clear();

    // Redirect
    window.location.replace(config.logout.redirectUrl);
}

/**
 * Logout action.
 */
async function handleLogout() {
    try {
        if (client) {
            await client.logoutAllGroups();
        }
        logoutRedirect();
    } catch (error) {
        handleGenericError(error);
        // Still redirect even if logout fails
        logoutRedirect();
    }
}

/**
 * Handle unauthorized users.
 *
 * @param {Object|string} error - Object representing originating error or error message.
 */
function handleUnauthorizedUser(error) {
    console.log("Handling unauthorized user:", error);
    
    // Clear any existing session data
    localStorage.removeItem("sessionId");
    
    try {
        // Try to use login function from login.js if it exists
        if (typeof login === 'function') {
            try {
                console.log("Using login function from login.js");
                login("default");
                return;
            } catch (loginError) {
                console.log("Error calling login function:", loginError);
                // Continue with fallback login method
            }
        }

        // Make sure client is initialized
        if (!client && window.DriveWorksLiveClient) {
            console.log("Initializing DriveWorksLiveClient");
            try {
                client = new window.DriveWorksLiveClient(config.serverUrl);
            } catch (error) {
                console.log("Error initializing client:", error);
                return;
            }
        }

        // Fallback to automatic login with blank credentials
        if (client) {
            console.log("Attempting automatic login with blank credentials");
            client.loginGroup(config.groupAlias, { username: "", password: "" })
                .then(result => {
                    if (result) {
                        console.log("Automatic login successful, session ID:", result.sessionId);
                        // Store session details to localStorage
                        localStorage.setItem("sessionId", result.sessionId);
                        localStorage.setItem("sessionAlias", config.groupAlias);
                        localStorage.setItem("sessionUsername", "Guest");

                        // Check if we're on the details page and need a specification ID
                        const currentUrl = window.location.href;
                        if (currentUrl.includes('details.html') && !currentUrl.includes('specification=')) {
                            // Redirect to index if on details page without specification
                            window.location.href = 'index.html';
                        } else {
                            // Refresh the current page to apply the new session
                            window.location.reload();
                        }
                    } else {
                        console.log("Automatic login failed for unauthorized user");
                    }
                })
                .catch(error => {
                    console.log("Error during automatic login for unauthorized user:", error);
                });
        } else {
            console.log("Cannot handle unauthorized user: client not available");
        }
    } catch (error) {
        console.log("Error handling unauthorized user:", error);
    }
}

/**
 * Mobile navigation toggle.
 */
function handleMobileNavigationToggle() {
    const navList = document.getElementById("nav-list");
    if (!navList) {
        return;
    }

    const navToggle = document.getElementById("nav-toggle");
    if (navToggle) {
        navToggle.onclick = function () {
            document.body.classList.toggle("sidebar-open");
        };
    }

    const navClose = document.getElementById("nav-close");
    if (navClose) {
        navClose.onclick = function () {
            document.body.classList.remove("sidebar-open");
        };
    }
}

/**
 * Split string on uppercase.
 * "MyStringValue" => "My String Value".
 *
 * @param {string} string - The string to split.
 */
function splitOnUpperCase(string) {
    return string.split(/(?=[A-Z])/).join(" ");
}

/**
 * Format string to remove (clean) special characters, lowercase & hyphenate whitespace for class & file names.
 * e.g. "Total (Plus VAT) " => "total-plus-vat".
 *
 * @param {string} string - The string to normalize.
 */
function normalizeString(string) {
    string = string.toLowerCase();
    string = string.replaceAll(/[^a-zA-Z0-9 _-]/g, ""); // Strip all characters excluding: alphanumeric, whitespace, underscore, hyphen
    string = string.trim(); // Remove outer whitespace
    string = string.replaceAll(/ +/g, "-"); // Convert whitespace to hyphens
    return string;
}

/**
 * Check if 2 objects are equal.
 *
 * @param {Object} a - The 1st object to compare.
 * @param {Object} b - The 2nd object to compare.
 */
function objectsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Check if object is empty.
 *
 * @param {Object} obj - The object to check for content.
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Visual output of username.
 */
function showUsername() {
    const usernameOutput = document.getElementById("active-username");
    const username = localStorage.getItem("sessionUsername");
    if (!username || !usernameOutput) {
        return;
    }

    usernameOutput.classList.add("is-shown");
    
    const usernameElement = document.querySelector("#active-username .username");
    if (usernameElement) {
        usernameElement.innerHTML = username;
        adjustFontSize();
    }
}

function adjustFontSize() {
    const element = document.querySelector('.username');
    if (!element) {
        return;
    }
    
    let fontSize = 20;
    element.style.fontSize = fontSize + 'px';

    try {
        while (element.scrollWidth > element.clientWidth && fontSize > 10) {
            if (config.debug) {
                console.debug(fontSize);
            }
            fontSize -= 1;
            element.style.fontSize = fontSize + 'px';
        }
    } catch (error) {
        console.log("Error adjusting font size:", error);
    }
}

// run adjustFontSize() on load or zoom
window.addEventListener('load', function() {
    setTimeout(adjustFontSize, 500); // Delay to ensure elements are rendered
});
window.addEventListener('resize', adjustFontSize);

/**
 * Detect touch devices - alter UI accordingly.
 */
function detectTouchDevice() {
    try {
        document.createEvent("TouchEvent");
        document.body.classList.add("touch");
    } catch (error) {
        document.body.classList.add("no-touch");
    }
}

/**
 * Get local Session Id from storage - between pages.
 */
function getLocalSession() {
    return localStorage.getItem("sessionId");
}

/**
 * Handle generic error.
 *
 * @param {Object} error - Error object to handle.
 */
function handleGenericError(error) {
    console.log(error);
}

/**
 * Ensure DateTime provided is specified as UTC.
 * As of DriveWorks 21.1 the time being reported is not in UTC format
 * @param {string} dateTime - DateTime string to parse.
 * @return {string} DateTime in UTC format
 */
function ensureDateTimeUTC(dateTime) {
    // First we need to check if there is no time encoded in the string
    // This could be because null, blank string, false, or just a date
    // If so, return it as is
    if (!dateTime || !dateTime.includes("T")) {
        return dateTime;
    }

    // We also need to check if this issue has already been fixed
    // If so, we can return as is.
    if (dateTime.includes("Z")) {
        return dateTime;
    }

    /* With DriveWorks 21.1 and below the time is being reported in the format
        2024-03-08T00:19:33.517-05:00
        The time is UTC, but the timezone is that of the server, so the time is incorrect.
        Our goal is to strip the timezone offset (-05:00) from the end of the string and replace it with Z
        Z is the denotation for Zulu, meaning UTC+0, or Greenwich mean time
        the end of the string will have a timezone in it with either a + or -
        For example
            2024-03-08T00:19:33.517-05:00 or 2024-03-08T00:19:33.517+12:30
        So we are going to identify the position of this, then replace it with Z
    */
    const regex = /[-+]\d{2}:\d{2}$/; // Match timezone offset pattern like "-05:00"
    let UTCdateTime = "";
    if (!regex.test(dateTime)) {
        // If no timezone offset is found, assume it's UTC and append 'Z'
        UTCdateTime = dateTime + "Z";
    } else {
        UTCdateTime = dateTime.replace(regex, "Z");
    }
    return UTCdateTime;
}

// Create a DateTime formatting object
// This is a performance boost instead of looking through the locale options each time
// See recommendation from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString
const dateTimeFormat = new Intl.DateTimeFormat(config.locale, config.dateFormat);

/**
 * Convert DateTime string to localized string
 * This uses the options in configUser.js
 * @param {string} dateTime
 * @return {string}
 */
function localizedDateTimeString(dateTime) {
    // First we need to check if there is no time encoded in the string
    // This could be because null, blank string, false, or just a date
    // If so, return it as is
    if (!dateTime || !dateTime.includes("T")) {
        return dateTime;
    }

    // ensure the string is in universal time
    const UTCdateTime = ensureDateTimeUTC(dateTime);

    const date = new Date(UTCdateTime);
    const formattedDate = dateTimeFormat.format(date);

    return formattedDate;
}

/**
 * Send info the console if debug is enabled.
 * @param {...any} args
 * @return {void}
 */
function consoleDebug(...args) {
    if (config.debug) {
        console.debug(...args);
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

