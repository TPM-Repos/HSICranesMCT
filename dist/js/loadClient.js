const script = document.createElement("script")
checkConfig()

function checkConfig() {
    if (typeof config !== 'undefined' && config.serverUrl) {
        loadClient()
    } else {
        setTimeout(checkConfig, 50)
    }
}
function loadClient() {
    script.src =
        config.serverUrl + "/DriveWorksLiveIntegrationClient.min.js"
    script.onerror = () => dwClientLoadError()
    script.onload = () => dwClientLoaded() // Custom local function run when client has loaded
    document.body.appendChild(script)
}