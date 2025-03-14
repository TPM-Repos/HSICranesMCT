// Global variable to prevent redeclaration issues
window.clientInitialized = false;

/**
 * Load the DriveWorks client library
 */
function loadClient() {
    console.log("Loading DriveWorks client from:", config.serverUrl);
    
    // Check if script is already loaded
    if (window.DriveWorksLiveClient) {
        console.log("DriveWorksLiveClient already loaded, calling dwClientLoaded directly");
        if (typeof dwClientLoaded === 'function') {
            dwClientLoaded();
        }
        return;
    }
    
    // Check if we're already initializing
    if (window.clientInitialized) {
        console.log("Client initialization already in progress");
        return;
    }
    
    window.clientInitialized = true;
    
    const script = document.createElement("script");
    script.src = config.serverUrl + "/DriveWorksLiveIntegrationClient.min.js";
    
    script.onerror = () => {
        console.log("Error loading DriveWorksLiveClient script");
        window.clientInitialized = false;
        if (typeof dwClientLoadError === 'function') {
            dwClientLoadError();
        }
    };
    
    script.onload = () => {
        console.log("DriveWorksLiveClient script loaded successfully");
        if (typeof dwClientLoaded === 'function') {
            dwClientLoaded();
        }
    };
    
    document.body.appendChild(script);
}

