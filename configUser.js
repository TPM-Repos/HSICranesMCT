// Version 1.2.9

const config = {
    version: "1.2.9",
    // the full path the site running the DriveWorks Live API
    // serverUrl: "https://dw21api.yourdomain.com",
    serverUrl: "https://22.dwapi.hsicrane.com",
    // The default alias for the DriveWorks Group
    // This is a custom string that must match the name in the ConfigUser.xml file
    groupAlias: "development",
    // (Optional) Configure ping & update intervals - in seconds
    // A Specification will timeout after a configured period of inactivity (see DriveWorksConfigUser.xml).
    // This function prevents a Specification timing out as long as the page is in view.
    // Disable the ping by setting to 0
    specificationPingInterval: 0,
    // (Optional) Enter custom redirect URLs for login/logout and Project/DriveApp close/cancel
    login: {
        redirectUrl: "projects.html",
        // Set this to left, center, or right to position the login form on the page
        columnLocation: "center",
    },
    logout: {
        redirectUrl: "index.html",
    },
    project: {
        redirectOnClose: "details.html",
        redirectOnCancel: "projects.html",
    },
    driveApp: {
        redirectOnClose: "details.html",
        redirectOnCancel: "drive-apps.html",
    },
    // (Optional) Configure 'Run' view
    run: {
        showWarningOnExit: true, // Toggle warning dialog when exiting "Run" view with potentially unsaved changes (where supported)
        loadCustomProjectAssets: {
            scripts: false,
            styles: false,
        },
    },
    // (Optional) Configure 'Details' view
    details: {
        updateInterval: 5, // Interval to refresh content - in seconds
        showStartNewSpecificationAction: true,
    },
    // (Optional) Configure the query function
    // Enter a default Group Alias and/or Project name to be used (when none are passed in the query string)
    // Choose how sessions are handled
    query: {
        defaultGroupAlias: "developmentGuest",
        defaultProjectName: "",
        autoLogin: true,
        requireNewSession: false,
        requireExactAlias: false,
    },
    copyright: {
        show: true,
        holder: "Handling Systems International",
        year: "2024"
    },
    // Add a watermark over pages in order to indicate that the site is a development site
    // comment out or set to "" to disable
    watermark: "Development Site",
    // Set the title of the site, this will be displayed in the browser tab
    // pageName | siteName
    siteName: "HSI",
    usernameType: "Email Address",
    passwordRequired: false,
    loginReturnUrls: true, // Toggle appending return urls to restore the previous location when redirected to the login form
    locale: "en-US", // Set the default locale for displaying dates and numbers
    dateFormat: {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    },
    // Whether to show debugging information in the console
    debug: false,
    allowSingleSignOn: false,
    guestLogin: {
		enabled: true,
		alias: "developmentGuest",
	},
    accountManagement: {
		createAccount: "run=AccountManagement&DWMacroNavigate=CreateAccount",
		forgotPassword: "run=AccountManagement&DWMacroNavigate=ForgotPassword",
		resetPassword:
			"query?alias=development&run=AccountManagement&DWMacroNavigate=ResetPassword",
	},
    sidebarLinks: [
        {
            title: "Projects",
            icon: "projects",
            href: "projects.html",
        },
        // {
        //     title: "DriveApps",
        //     icon: "drive-apps",
        //     href: "drive-apps.html",
        // },
        {
            title: "History",
            icon: "history",
            href: "history.html",
        }
    ],
    images: {
        loginCover: "dist/img/HSI-Background.webp",
    }
};
