// Version 1.2.9
/**
 * RUNNING SPECIFICATION
 */

// Get config
const SPECIFICATION_PING_INTERVAL =
	typeof config.specificationPingInterval === "number"
		? config.specificationPingInterval
		: 0

// Get URL query values
const URL_QUERY = new URLSearchParams(window.location.search)
const QUERY_PROJECT_NAME = URL_QUERY.get("project")
const QUERY_SPECIFICATION_ID = URL_QUERY.get("specification")
const QUERY_DRIVE_APP_ALIAS = URL_QUERY.get("driveApp")

const QUERY_PREFIX_CONSTANTS = "DWConstant"
const QUERY_PREFIX_MACROS = "DWMacro"
const specificationQueryParameters = []
for (const [key, value] of URL_QUERY) {
	// Constant to update (name, value)
	if (key.startsWith(QUERY_PREFIX_CONSTANTS)) {
		specificationQueryParameters.push({
			type: QUERY_PREFIX_CONSTANTS,
			name: key.replace(QUERY_PREFIX_CONSTANTS, ""),
			value: value,
		})
	}

	// Macro to run (name, argument [optional])
	if (key.startsWith(QUERY_PREFIX_MACROS)) {
		specificationQueryParameters.push({
			type: QUERY_PREFIX_MACROS,
			name: key.replace(QUERY_PREFIX_MACROS, ""),
			argument: value,
		})
	}
}

// Get elements
const CONTENT_NAVIGATION = document.getElementById("content-navigation")
const FORM_CONTAINER = document.getElementById("form-container")
const FORM_LOADING_STATE = document.getElementById("form-loading")
const SPECIFICATION_ACTIONS = document.getElementById("specification-actions")
const SPECIFICATION_CANCEL_BUTTON = document.getElementById(
	"specification-cancel-button",
)

// Store Specification Id globally
let rootSpecificationId
let activeSpecificationId

// Detect current config type based on query values
let currentConfig = config.project
if (QUERY_DRIVE_APP_ALIAS) {
	currentConfig = config.driveApp
}

/**
 * Start page functions.
 */
function startPageFunctions() {
	console.log("Starting run.js page functions");
	
	// Check if we have a valid session
	if (!client || !client._sessionId) {
		console.log("No valid session found in run view");
		
		// Try to login automatically
		if (typeof login === 'function') {
			try {
				login("default");
				// Wait for login to complete before continuing
				setTimeout(checkSessionAndContinue, 1000);
				return;
			} catch (error) {
				console.log("Error during automatic login:", error);
			}
		}
		
		// If login function not available or fails, show error
		renderError("Session not found. Please return to the home page and try again.");
		return;
	}
	
	continueWithValidSession();
}

/**
 * Check if session is valid after login attempt
 */
function checkSessionAndContinue() {
	if (client && client._sessionId) {
		console.log("Session established, continuing");
		continueWithValidSession();
	} else {
		console.log("Failed to establish session");
		renderError("Unable to establish session. Please return to the home page and try again.");
	}
}

/**
 * Continue with page functions once session is valid
 */
function continueWithValidSession() {
	if (typeof setCustomClientErrorHandler === 'function') {
		setCustomClientErrorHandler();
	}

	// Show confirmation dialog before logout
	if (config.run.showWarningOnExit) {
		enableLogoutConfirmation();
	}

	// Detect required values
	if (
		!QUERY_SPECIFICATION_ID &&
		!QUERY_PROJECT_NAME &&
		!QUERY_DRIVE_APP_ALIAS
	) {
		console.log("Missing required query parameters");
		renderError("Invalid Specification Id, Project name or DriveApp alias.");
		return;
	}

	// Log which path we're taking
	if (QUERY_SPECIFICATION_ID) {
		console.log("Opening existing specification:", QUERY_SPECIFICATION_ID);
	} else if (QUERY_PROJECT_NAME) {
		console.log("Creating new specification for project:", QUERY_PROJECT_NAME);
	} else if (QUERY_DRIVE_APP_ALIAS) {
		console.log("Creating new DriveApp specification:", QUERY_DRIVE_APP_ALIAS);
	}

	// Existing Specification
	if (QUERY_SPECIFICATION_ID) {
		renderExistingSpecification();
		return;
	}

	// New Specification
	if (QUERY_PROJECT_NAME) {
		createSpecification();
		return;
	}

	// New DriveApp
	if (QUERY_DRIVE_APP_ALIAS) {
		createDriveAppSpecification();
		return;
	}
}

/**
 * Display error when rendering. Redirect after short delay.
 *
 * @param {string} message - The message display on the login screen.
 * @param {Object} [error] - The error thrown.
 */
function renderError(message, error = null) {
	if (error) {
		console.log("Error details:", error);
	}

	// Check if FORM_LOADING_STATE exists
	if (FORM_LOADING_STATE) {
		try {
			// Show visually error message
			FORM_LOADING_STATE.innerHTML = `
				<div class="run-error">
					<h3>${message}</h3>
					<p>Taking you back...</p>
				</div>
			`;
		} catch (innerError) {
			console.log("Error updating loading state:", innerError);
		}
	} else {
		console.log("Form loading state element not found");
	}

	// Redirect to index page after short delay
	console.log("Redirecting to index page due to error:", message);
	setTimeout(() => {
		try {
			window.location.href = "index.html";
		} catch (redirectError) {
			console.log("Error during redirect:", redirectError);
		}
	}, 2000);
}

/**
 * Create new Specification.
 */
async function createSpecification() {
	const createError = "Error creating Specification."
	setTabTitle(QUERY_PROJECT_NAME)
	console.log("Creating new specification for project:", QUERY_PROJECT_NAME);

	try {
		// Check if we have a valid session
		if (!client || !client._sessionId) {
			console.log("No valid session found when creating specification");
			handleUnauthorizedUser("No valid session found");
			return;
		}
		
		// Create new Specification
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		console.log("Calling createSpecification API with group:", groupAlias);
		let specification;
		try {
			specification = await client.createSpecification(
				groupAlias,
				QUERY_PROJECT_NAME,
			);
		} catch (createSpecError) {
			console.log("Error from createSpecification API:", createSpecError);
			
			if (createSpecError.status === 401) {
				handleUnauthorizedUser(createSpecError);
				return;
			}
			
			renderError(createError, createSpecError);
			return;
		}

		if (!specification || !specification.id) {
			console.log("No specification ID returned");
			renderError(createError);
			return;
		}

		console.log("Specification created successfully, ID:", specification.id);
		
		// Render
		renderNewSpecification(specification);
	} catch (error) {
		console.log("Unexpected error creating specification:", error);
		renderError(createError, error);
	}
}

/**
 * Create new DriveApp Specification.
 */
async function createDriveAppSpecification() {
	const createError = "Error creating DriveApp Specification."
	setTabTitle(QUERY_DRIVE_APP_ALIAS)

	try {
		// Create new DriveApp Specification
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		const driveAppSpecification = await client.runDriveApp(
			groupAlias,
			QUERY_DRIVE_APP_ALIAS,
		)

		if (!driveAppSpecification.id) {
			renderError(createError)
		}

		// Render
		renderNewSpecification(driveAppSpecification, false)
	} catch (error) {
		renderError(createError, error)
	}
}

/**
 * Render new Specification to container.
 *
 * @param {Object} specification - DriveWorks Specification object.
 */
async function renderNewSpecification(
	specification,
	showSpecificationNameInTitle = true,
) {
	rootSpecificationId = specification.id
	activeSpecificationId = rootSpecificationId

	// Process Specification parameters from query (if supplied)
	await processSpecificationQueryParameters()

	// Render Form markup
	await specification.render(FORM_CONTAINER)

	// Clear loading state (with delay to hide re-layout)
	removeLoadingState()

	// [OPTIONAL] Show warning dialog when exiting page after Form renders
	attachPageUnloadDialog()

	// Register external Form navigation buttons
	registerFormButtons(specification)

	// Set the default navigation state (open or closed)
	setNavigationState()

	// Get Actions
	renderSpecificationActions()

	// Register Specification events
	const formElement = specification.specificationFormElement
	attachSpecificationEvents(formElement)

	specification.registerSpecificationClosedDelegate(() => formClosed())
	specification.registerSpecificationCancelledDelegate(() => formCancelled())

	// Start ping (keep Specification alive)
	pingSpecification(specification)

	// attach logout to particular buttons
	attachLogoutButtons()

	// [OPTIONAL] Show Specification Name in browser tab title
	if (showSpecificationNameInTitle) {
		setTabTitleSpecificationName(specification)
	}

	// [OPTIONAL] Load custom assets for this Project
	loadCustomProjectAssets(QUERY_PROJECT_NAME)
}

/**
 * Render existing Specification in current State e.g. after Transition.
 */
async function renderExistingSpecification() {
	const existingError = "Error opening existing Specification."
	setTabTitle(QUERY_SPECIFICATION_ID)
	console.log("Rendering existing specification:", QUERY_SPECIFICATION_ID);

	try {
		// Check if we have a valid session
		if (!client || !client._sessionId) {
			console.log("No valid session found when rendering existing specification");
			handleUnauthorizedUser("No valid session found");
			return;
		}
		
		// Validate Specification Id provided can be rendered.
		console.log("Validating specification can be rendered");
		const groupAliasForValidation = localStorage.getItem("sessionAlias") || config.groupAlias;
		let specificationToValidate;
		try {
			specificationToValidate = await client.getSpecificationById(
				groupAliasForValidation,
				QUERY_SPECIFICATION_ID,
			);
		} catch (validationError) {
			console.log("Error validating specification:", validationError);
			
			if (validationError.status === 401) {
				handleUnauthorizedUser(validationError);
				return;
			}
			
			renderError(existingError, validationError);
			return;
		}

		if (!specificationToValidate) {
			console.log("Specification not found");
			renderError("Specification not found.");
			return;
		}

		if (specificationToValidate.stateType !== 0) {
			console.log("Specification is not in running state:", specificationToValidate.stateType);
			renderError("Specification is not running.");
			return;
		}

		// Get existing Specification
		console.log("Creating specification by ID");
		const groupAliasForCreation = localStorage.getItem("sessionAlias") || config.groupAlias;
		const specification = await client.createSpecificationById(
			groupAliasForCreation,
			QUERY_SPECIFICATION_ID,
		);

		rootSpecificationId = specification.id;
		activeSpecificationId = rootSpecificationId;
		console.log("Specification created, ID:", specification.id);

		// Process Specification parameters from query (if supplied)
		await processSpecificationQueryParameters();

		// Render Form markup
		console.log("Rendering specification form");
		await specification.render(FORM_CONTAINER);

		// Clear loading state (with delay to hide re-layout)
		removeLoadingState();

		// [OPTIONAL] Show warning dialog when exiting page after Form renders
		attachPageUnloadDialog();

		// Set the default navigation state (open or closed)
		setNavigationState();

		// Register external Form navigation buttons
		registerFormButtons(specification);

		// Get Actions
		renderSpecificationActions();

		// Register events
		const formElement = specification.specificationFormElement;
		attachSpecificationEvents(formElement);

		specification.registerSpecificationClosedDelegate(() =>
			existingSpecificationClosed(),
		);
		specification.registerSpecificationCancelledDelegate(() =>
			existingSpecificationCancelled(),
		);

		// Start ping (keep Specification alive)
		pingSpecification(specification);

		// attach logout to particular buttons
		attachLogoutButtons();

		// [OPTIONAL] Show Specification Name in browser tab title
		setTabTitleSpecificationName(specification);

		// [OPTIONAL] Load custom assets for this Project
		loadCustomProjectAssets();
		
		console.log("Existing specification rendered successfully");
	} catch (error) {
		console.log("Error rendering existing specification:", error);
		
		if (error.status === 401) {
			handleUnauthorizedUser(error);
			return;
		}
		
		renderError(existingError, error);
	}
}

/**
 * Ping the running Specification.
 *
 * A Specification will timeout after a configured period of inactivity (see DriveWorksConfigUser.xml).
 * This function prevents a Specification timing out as long as the page is in view.
 *
 * @param {Object} specification - The Specification object.
 */
function pingSpecification(specification) {
	// Disable ping if interval is 0
	if (SPECIFICATION_PING_INTERVAL === 0) {
		return
	}

	try {
		// Ping Specification to reset timeout
		specification.ping()

		// Schedule next ping
		setTimeout(
			pingSpecification,
			SPECIFICATION_PING_INTERVAL * 1000,
			specification,
		)
	} catch (error) {
		handleGenericError(error)
	}
}

/**
 * Load additional Project assets.
 *
 * Enables custom scripts or styles to be loaded per Project.
 * These can be used to expand functionality, or create advanced Control styles.
 *
 * @param {string} project - The name of the Project to load matching assets.
 */
async function loadCustomProjectAssets(project) {
	if (config.run.loadCustomProjectAssets === undefined) {
		return
	}

	if (
		config.run.loadCustomProjectAssets.scripts === false &&
		config.run.loadCustomProjectAssets.styles === false
	) {
		return
	}

	const customAssetsFolder = "custom-project-assets"
	let projectName

	// Use Project name passed in, or retrieve from Specification details
	if (project) {
		projectName = project
	} else {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		const specification = await client.getSpecificationById(
			groupAlias,
			rootSpecificationId,
		)
		projectName = specification.originalProjectName
	}

	// Clean Project name
	const cleanProjectName = normalizeString(projectName)

	// Add class to body filename
	document.body.classList.add(`dw-project-${cleanProjectName}`)

	// Load custom assets
	const assetPath = `${customAssetsFolder}/${cleanProjectName}`
	const assetPromises = []

	if (config.run.loadCustomProjectAssets.scripts) {
		assetPromises.push(loadCustomScripts(assetPath))
	}

	if (config.run.loadCustomProjectAssets.styles) {
		assetPromises.push(loadCustomStyles(assetPath))
	}

	await Promise.allSettled(assetPromises)
}

/**
 * Append additional script file.
 *
 * @param {string} path - The path of the custom script.
 */
async function loadCustomScripts(path) {
	const filePath = `${path}.js`
	const validScripts = await fileExists(filePath)
	if (!validScripts) {
		return
	}

	const script = document.createElement("script")
	script.src = filePath
	document.head.appendChild(script)
}

/**
 * Append additional stylesheet.
 *
 * @param {string} path - The path of the custom stylesheet.
 */
async function loadCustomStyles(path) {
	const filePath = `${path}.css`
	const validStyles = await fileExists(filePath)
	if (!validStyles) {
		return
	}

	const style = document.createElement("link")
	style.setAttribute("rel", "stylesheet")
	style.setAttribute("type", "text/css")
	style.setAttribute("href", filePath)
	document.head.appendChild(style)
}

/**
 * Detect external navigation (sidebar) display changes.
 *
 * @param {boolean} [showNavigation] - Set navigation to be open (true) or closed (false).
 */
async function setNavigationState(showNavigation = null) {
	// If no state provided, query from server
	if (showNavigation == null) {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		const formData = await client.getSpecificationFormData(
			groupAlias,
			rootSpecificationId,
		)
		showNavigation = formData.form.showStandardNavigation
	}

	// Update visual state
	showNavigation ? showFormNavigation() : hideFormNavigation()
}

/**
 * Listen for Form events.
 *
 * @param {Object} formElement - Specification Form element.
 */
function attachSpecificationEvents(formElement) {
	formElement.addEventListener("FormUpdated", (event) => {
		formUpdated(event)
		renderSpecificationActions()
	})

	formElement.addEventListener("ActionsUpdated", async () => {
		disableSpecificationActions()

		// Ensure we have the latest Specification Id
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		const formData = await client.getSpecificationFormData(
			groupAlias,
			rootSpecificationId,
		)
		activeSpecificationId = formData.form.specificationId

		renderSpecificationActions()
	})
}

/**
 * Cancel Specification.
 */
async function cancelSpecification() {
	if (activeSpecificationId === rootSpecificationId) {
		// Cancel root Specification - with redirect.
		detachPageUnloadDialog()
const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
await client.cancelSpecification(groupAlias, rootSpecificationId)
} else {
// Cancel active child Specification - no redirect.
const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
await client.cancelSpecification(groupAlias, activeSpecificationId)
		await client.cancelSpecification(GROUP_ALIAS, activeSpecificationId)
	}
}

/**
 * Register Form Action buttons
 */
function registerFormButtons(specification) {
	// Cancel button
	SPECIFICATION_CANCEL_BUTTON.onclick = () => {
		if (config.run.showWarningOnExit) {
			showConfirmationDialog(cancelSpecification)
			return
		}

		cancelSpecification()
	}

	// Form navigation buttons
	specification.registerNextButton(
		document.getElementById("form-next-button"),
	)
	specification.registerPreviousButton(
		document.getElementById("form-previous-button"),
	)
	specification.registerOkButton(document.getElementById("dialog-ok-button"))
	specification.registerCancelButton(
		document.getElementById("dialog-cancel-button"),
	)
}

/**
 * Render Specification Actions (Operations & Transitions).
 */
async function renderSpecificationActions() {
	// Get all Actions
	const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
	const actions = await client.getSpecificationActions(
		groupAlias,
		activeSpecificationId,
	)

	// Output Actions if: not stored (first run), objects don't match
	if (!isEmpty(actions)) {
		// Clear out old Actions
		SPECIFICATION_ACTIONS.innerHTML = ""

		for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
			const action = actions[actionIndex]
			const name = action.name
			const title = action.title
			const type = action.type

			// Create button
			const button = document.createElement("button")
			button.classList.add("action-button")
			button.innerHTML = title

			// Check type
			if (type === "Operation") {
				renderOperationAction(name, button)
			} else {
				renderTransitionAction(name, button)
			}
		}
	}

	document.body.classList.add("actions-shown")
}

/**
 * Disable Specification Actions (Operations & Transitions).
 */
async function disableSpecificationActions() {
	const actions = SPECIFICATION_ACTIONS.querySelectorAll("button")

	for (const action of actions) {
		action.disabled = true
	}
}

/**
 * Render Operation.
 *
 * @param {string} name - The name of the Operation.
 * @param {Object} button - The button to attach click events.
 */
function renderOperationAction(name, button) {
	// Visually mark as Operation
	button.classList.add("action-operation")

	// Attach click
	button.onclick = () => {
		if (button.disabled) return
		invokeOperation(name)
	}

	// Output button
	SPECIFICATION_ACTIONS.appendChild(button)
}

/**
 * Render Transition.
 *
 * @param {string} name - The name of the Transition.
 * @param {Object} button - The button to attach click events.
 */
function renderTransitionAction(name, button) {
	// Visually mark as Transition
	button.classList.add("action-transition")

	// Attach click
	button.onclick = () => {
		if (button.disabled) return
		invokeTransition(name)
	}

	// Output button
	SPECIFICATION_ACTIONS.appendChild(button)
}

/**
 * Process Macro and Constant data passed as query parameters.
 */
async function processSpecificationQueryParameters() {
	for (const parameter of specificationQueryParameters) {
		switch (parameter.type) {
			case QUERY_PREFIX_CONSTANTS:
				await driveConstant(parameter)
				break
			case QUERY_PREFIX_MACROS:
				await runMacro(parameter)
				break
		}
	}
}

/**
 * Drive Constant value.
 * @param {Object} constant - Object containing the Constant name and value.
 */
async function driveConstant(constant) {
	const constantName = constant.name
	const constantValue = constant.value

	try {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		await client.getSpecificationConstantByName(
			groupAlias,
			activeSpecificationId,
			constantName,
		)
		await client.updateConstantValue(
			groupAlias,
			activeSpecificationId,
			constantName,
			constantValue,
		)
	} catch (error) {
		console.log(error)
		console.log(
			`Unable to set the value of Constant '${constantName}' to '${constantValue}'.`,
		)
	}
}

/**
 * Run a Macro.
 * @param {Object} macro - Object containing the Macro name and argument.
 */
async function runMacro(macro) {
	const macroName = macro.name
	const macroArgument = macro.argument

	try {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		await client.runMacro(groupAlias, activeSpecificationId, {
			macroName: macroName,
			macroArgument: macroArgument,
		})
	} catch (error) {
		console.log(error)
		console.log(
			`Unable to run Macro '${macroName}'. ${
				macroArgument
					? `(Argument: ${macroArgument})`
					: "(No argument specified)"
			}`,
		)
	}
}

/**
 * Invoke Operation.
 *
 * @param {string} operationName - The name of the Operation to invoke.
 */
async function invokeOperation(operationName) {
	try {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		await client.getSpecificationOperationByName(
			groupAlias,
			activeSpecificationId,
			operationName,
		)
		await client.invokeOperation(
			groupAlias,
			activeSpecificationId,
			operationName,
		)
	} catch (error) {
		handleGenericError(error)
	}
}

/**
 * Invoke Transition.
 *
 * @param {string} transitionName - The name of the Transition to invoke.
 */
async function invokeTransition(transitionName) {
	// Redirect only if root Specification is actively displayed, not a child Specification.
	const redirectAfterTransition =
		activeSpecificationId === rootSpecificationId

	try {
		const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
		await client.getSpecificationTransitionByName(
			groupAlias,
			activeSpecificationId,
			transitionName,
		)
		await client.invokeTransition(
			groupAlias,
			activeSpecificationId,
			transitionName,
		)

		if (redirectAfterTransition) {
			detachPageUnloadDialog()

			redirectOnSpecAction("close")
		}
	} catch (error) {
		handleGenericError(error)
	}
}

/**
 * Triggers on Form update.
 *
 * @param {Object} event - FormUpdated event object.
 */
function formUpdated(event) {
	const data = event.detail.specData

	// Update active Specification Id
	if (data.specificationId) {
		activeSpecificationId = data.specificationId
	}

	// Update navigation state
	if (typeof data.showStandardNavigation === "boolean") {
		setNavigationState(data.showStandardNavigation)
	}

	// Hide Specification Action buttons if active Form is a dialog
	if (typeof data.isDialog === "boolean") {
		SPECIFICATION_ACTIONS.hidden = data.isDialog
		SPECIFICATION_CANCEL_BUTTON.hidden = data.isDialog
	}
}

/**
 * Form closed.
 */
function formClosed() {
	detachPageUnloadDialog()

	redirectOnSpecAction("close")
}

/**
 * Form cancelled.
 */
function formCancelled() {
	detachPageUnloadDialog()

	redirectOnSpecAction("cancel")
}

/**
 * Existing Specification closed.
 */
function existingSpecificationClosed() {
	detachPageUnloadDialog()

	redirectOnSpecAction("close")
}

/**
 * Existing Specification cancelled.
 */
function existingSpecificationCancelled() {
	redirectOnSpecAction("close")
}

/**
 * Redirect On Close
 */
function redirectOnSpecAction(action = "close") {
	const username = localStorage.getItem("sessionUsername")
	const sessionAlias = localStorage.getItem("sessionAlias")
	const isResetPassword = window.location.href.includes("ResetPassword")
	if (username === "Guest" || sessionAlias === config.query.defaultGroupAlias || isResetPassword) {
		page = "logout"
	} else if (action === "close") {
		page = currentConfig.redirectOnClose
	} else if (action === "cancel") {
		page = currentConfig.redirectOnCancel
	}
	if(page === "logout") {
		handleLogout()
	} else {
		window.location.href = `${page}?specification=${rootSpecificationId}`
	}
}

/**
 * Hide Form loading state.
 */
function removeLoadingState() {
	// Delay to mask initial Form re-layout
	setTimeout(() => {
		FORM_LOADING_STATE.style.opacity = "0"

		setTimeout(() => {
			FORM_LOADING_STATE.remove()
		}, 350)
	}, 500)
}

/**
 * Show Form sidebar navigation - containing available Actions.
 */
function showFormNavigation() {
	CONTENT_NAVIGATION.style.display = ""
	document.body.classList.add("has-navigation")

	// Ensure Form size updates when content width changes
	window.dispatchEvent(new Event("resize"))
}

/**
 * Hide Form sidebar navigation - containing available Actions.
 */
function hideFormNavigation() {
	CONTENT_NAVIGATION.style.display = "none"
	document.body.classList.remove("has-navigation")

	// Ensure Form size updates when content width changes
	window.dispatchEvent(new Event("resize"))
}

/**
 * Get Form data - for debugging.
 */
async function getFormData() {
	const formData = await client.getSpecificationFormData(
		GROUP_ALIAS,
		rootSpecificationId,
	)
	console.log(formData)
}

/**
 * Check for existence of additional files.
 *
 * @param {string} url - URL of file to confirm existence.
 */
async function fileExists(url) {
	const response = await fetch(url, {method: "HEAD"})
	if (!response.ok) {
		console.log(`Could not find file: ${url}`)
		console.log("Create this file to apply additional functionality.")
		return false
	}

	console.log(`Additional file loaded: ${url}`)
	return true
}

/**
 * On page unload, show dialog to confirm navigation.
 */
function attachPageUnloadDialog() {
	if (config.run.showWarningOnExit) {
		window.addEventListener("beforeunload", beforeUnloadHandler)
	}
}

/**
 * Remove dialog on page unload.
 */
function detachPageUnloadDialog() {
	window.removeEventListener("beforeunload", beforeUnloadHandler)
}

/**
 * Handle beforeunload event.
 *
 * @param {Object} event - The beforeunload event object.
 */
function beforeUnloadHandler(event) {
	event.preventDefault()
	event.returnValue = "Are you sure you want to leave this page?"
}

/**
 * Set browser tab title to Specification name
 *
 * @param {Object} specification - DriveWorks Specification object
 */
async function setTabTitleSpecificationName(specification) {
	const formData = await specification.getFormData()
	setTabTitle(formData.form.specificationName)
}

/**
 * Set browser tab title
 *
 * @param {Object} text - The text to display in the title.
 */
function setTabTitle(text) {
	document.title = `${text} | Run - DriveWorks`
}

/**
 * Handle logout action
 */
async function handleLogout() {
    try {
        if (client) {
            await client.logoutAllGroups();
        }
        // Redirect to index page
        window.location.href = "index.html";
    } catch (error) {
        console.log("Error during logout:", error);
        // Still redirect even if logout fails
        window.location.href = "index.html";
    }
}

/**
 * Display confirmation dialog before logout.
 */
function enableLogoutConfirmation() {
	// Get all logout buttons
	const logoutButtons = document.getElementsByClassName("logout-button")
	if (!logoutButtons) {
		return
	}

	// Remove generic event, trigger custom dialog on click
	for (const logoutButton of logoutButtons) {
		logoutButton.removeEventListener("click", handleLogout)
		logoutButton.addEventListener("click", () =>
			showConfirmationDialog(handleLogout),
		)
	}
}

/**
 * Show custom confirmation dialog.
 *
 * @param {function} confirmAction - The function to trigger on confirmation.
 * @param {string} [message] - The message to display in the dialog.
 */
function showConfirmationDialog(confirmAction, message = "Are you sure?") {
	if (!confirmAction) {
		return
	}

	// Dialog
	const dialog = document.createElement("div")
	dialog.classList.add("custom-dialog")

	// Overlay
	const overlay = document.createElement("div")
	overlay.classList.add("dialog-overlay")
	overlay.onclick = () => dismissDialog()

	dialog.appendChild(overlay)

	// Message box
	const messageBox = document.createElement("div")
	messageBox.classList.add("dialog-message")
	messageBox.innerHTML = `<p>${message}</p>`

	// Confirm button
	const confirmButton = document.createElement("button")
	confirmButton.innerHTML = "Confirm"
	confirmButton.classList.add("confirm-button")
	confirmButton.onclick = () => {
		dialog.classList.add("is-loading")
		confirmAction()
		document.removeEventListener("keydown", dismissEscKey)
	}

	messageBox.appendChild(confirmButton)

	// Cancel button
	const cancelButton = document.createElement("button")
	cancelButton.innerHTML = "Cancel"
	cancelButton.classList.add("cancel-button")
	cancelButton.onclick = () => dismissDialog()

	messageBox.appendChild(cancelButton)

	// Show dialog (with animation)
	dialog.appendChild(messageBox)
	document.body.appendChild(dialog)

	setTimeout(() => {
		dialog.classList.add("open")
		confirmButton.focus()
	}, 50)

	// Dismiss dialog
	const dismissDialog = () => {
		dialog.remove()
		document.removeEventListener("keydown", dismissEscKey)
	}

	// Close with Esc key
	const dismissEscKey = (evt) => {
		evt = evt || window.event
		if (evt.key === "Escape") {
			dismissDialog()
		}
	}

	document.addEventListener("keydown", dismissEscKey)
}

/**
 * Attach logout actions to macro buttons
 */
function attachLogoutButtons() {
	const form_dom = document.querySelector("dw-form").shadowRoot
	const logoutButtons = form_dom.querySelectorAll("[data-metadata*='logout']")
	if (!logoutButtons) {
		console.log("no buttons found")
		return
	}

	for (const logoutButton of logoutButtons) {
		logoutButton.addEventListener("click", handleLogout)
	}
}

