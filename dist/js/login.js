// Version 1.2.9
/**
 * LOGIN
 */

const SERVER_URL = config.serverUrl
const LOGIN_REDIRECT_URL = config.login.redirectUrl
let GROUP_ALIAS = config.groupAlias
const URL_QUERY = new URLSearchParams(window.location.search)
const delay = ms => new Promise(res => setTimeout(res, ms));

// Error Messages
const genericErrorMessage = "Unable to login."
const clientErrorMessage = "Cannot access client."
const privateErrorMessage = "Please use a non-private window."

// DriveWorks Live Client
let client;

/**
 * On page load.
*/
(async function () {
	// Check localStorage support (show warning if not e.g. <= iOS 10 Private Window)
	if (!localStorageSupported()) {
		removeSkeleton()
		loginError(privateErrorMessage)
		return
	}

	showLoginNotice()
	setLoginColumnLocation()


	// how long until timing out trying to connect?
	await delay(5000)
	removeSkeleton()
})()

/**
 * Create client.
 */
async function dwClientLoaded() {
	try {
		client = new window.DriveWorksLiveClient(SERVER_URL)
	} catch (error) {
		loginError(clientErrorMessage, error)
		removeSkeleton()
	}

	// Quick Logout (?bye)
	// https://docs.driveworkspro.com/Topic/WebThemeLogout
	if (URL_QUERY.has("bye")) {
		await forceLogout()
	}

	if(client == null) {
		dwClientLoadError()
	} else {
		startPageFunctions()
		enableButtons()
	}

}

/**
 * Start page functions.
 */
function startPageFunctions() {
	try {
		login("default")
	} catch (error) {
		handleGenericError(error)
	}
	removeSkeleton()
}

async function login(type) {
	// Show error if cannot connect to client
	if (!client) {
		loginError(clientErrorMessage)
		return
	}

	try {
		// Show loading state, reset notice
		loginButton.classList.add("is-loading")
		hideLoginNotice()

		let result = null
		let inputUsername = null
		// Start Session
		if (type === "default" || type === null || type === "") {
			const userCredentials = {
				username: "",
				password: "",
			}
			result = await client.loginGroup(GROUP_ALIAS, userCredentials)
		}

		// Show error is login failed
		if (!result) {
			loginError(genericErrorMessage)
			return
		}

		loginSuccess(result, inputUsername)
	} catch (error) {
		loginError(genericErrorMessage, error)
	}
}

function handleLoginForm(event) {
	event.preventDefault()
	login("default", event)
}

function removeSkeleton() {
	loginButton.classList.remove("skeleton-block")
	loginSSOButton.classList.remove("skeleton-block")
	loginGuest.classList.remove("skeleton-block")
	createAccountButton.classList.remove("skeleton-block")
}

/**
 * Handle successful login. Store Session data to localStorage & redirect.
 */
function loginSuccess(result, username) {
	// Store session details to localStorage
	localStorage.setItem("sessionId", result.sessionId)
	localStorage.setItem("sessionAlias", GROUP_ALIAS)

	if (username) {
		localStorage.setItem("sessionUsername", username)
	}

	// Return to previous location (if redirected to login)
	const returnUrl = URL_QUERY.get("returnUrl")

	if (returnUrl && config.loginReturnUrls) {
		window.location.href = `${window.location.origin}/${decodeURIComponent(
			returnUrl,
		)}`
		return
	}
	// 

	// Redirect to default location
	window.location.href = LOGIN_REDIRECT_URL
}

/**
 * Handle login errors.
 *
 * @param {string} noticeText - The message to display when directed to the login screen.
 * @param {Object} [error] - The error object.
 */
function loginError(noticeText, error = null) {
	if (error) {
		handleGenericError(error)
	}

	// Remove loading state
	loginButton.classList.remove("is-loading")

	// Show client error
	setLoginNotice(noticeText, "error")
	showLoginNotice()
}

/**
 * Set login screen notice.
 *
 * @param {string} text - The message to display when directed to the login screen.
 * @param {string} [state] - The type of message state (error/success/info).
 */
function setLoginNotice(text, state = "info") {
	const notice = JSON.stringify({text: text, state: state})
	localStorage.setItem("loginNotice", notice)
}

/**
 * Show notice on login form.
 */
function showLoginNotice() {
	const notice = JSON.parse(localStorage.getItem("loginNotice"))

	if (!notice) {
		return
	}

	let state = notice.state

	if (!state) {
		state = "neutral"
	}

	// Display feedback
	loginNotice.innerText = notice.text
	loginNotice.classList.remove("error", "success", "neutral")
	loginNotice.classList.add(state, "is-shown")

	// Clear message
	localStorage.removeItem("loginNotice")
}

/**
 * Hide notice on login form.
 */
function hideLoginNotice() {
	loginNotice.classList.remove("is-shown")
}

/**
 * Check existing login. Automatically login if found.
 */
async function checkExistingLogin() {
	const storedGroupAlias = localStorage.getItem("sessionAlias")

	if (!storedGroupAlias) {
		return
	}

	try {
		// Test connection
		await client.getProjects(storedGroupAlias, "$top=1")

		// Redirect to initial location
		window.location.replace(LOGIN_REDIRECT_URL)
	} catch (error) {
		handleGenericError(error)
	}
}

/**
 * Force logout and session data clearing.
 */
async function forceLogout() {
	// Logout from all Groups.
	try {
		await client.logoutAllGroups()
	} catch (error) {
		handleGenericError(error)
	}

	// Clear session information from storage.
	localStorage.clear()

	// Show login screen message.
	setLoginNotice("You have been logged out.", "success")
	showLoginNotice()
}

/**
 * Check for localStorage support - used to store session information.
 * Example: Incognito (Private) windows in iOS 10 and below do not allow localStorage, errors when accessed.
 */
function localStorageSupported() {
	try {
		localStorage.setItem("storageSupportTest", "Test")
		localStorage.removeItem("storageSupportTest")
		return true
	} catch (e) {
		return false
	}
}

/**
 * Handle generic errors e.g. tryCatch.
 *
 * @param {Object} error - The error object.
 */
function handleGenericError(error) {
	console.log(error)
}

/**
 * DriveWorks Live client library load error.
 */
function dwClientLoadError() {
	loginError(clientErrorMessage)
	removeSkeleton()
}