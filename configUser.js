// Version 1.2.9

const config = {
    version: "1.2.9",
    // the full path the site running the DriveWorks Live API
    // serverUrl: "https://dw21api.yourdomain.com",
    serverUrl: "https://dw21api.hsicrane.com",
    // The default alias for the DriveWorks Group
    // This is a custom string that must match the name in the ConfigUser.xml file
    groupAlias: "development",
    // (Optional) Configure ping & update intervals - in seconds
    // A Specification will timeout after a configured period of inactivity (see DriveWorksConfigUser.xml).
    // This function prevents a Specification timing out as long as the page is in view.
    // Disable the ping by setting to 0
    specificationPingInterval: 0,
    // (Optional) Enter custom redirect URLs for login/logout and Project/DriveApp close/cancel
    folder: "dev",
    login: {
        redirectUrl: "run.html?project=Jib Cranes",
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
        requireNewSession: true,
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
		createAccount: "query?alias=developmentGuest&run=AccountManagement&DWMacroNavigate=CreateAccount",
		forgotPassword: "query?alias=developmentGuest&run=AccountManagement&DWMacroNavigate=ForgotPassword",
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
        },
        {
            title: "Reset Password",
            icon: "reset",
            href: "query?run=AccountManagement&DWMacroNavigate=ResetPassword",
        },
    ],
    images: {
        // You may use a different (or same) company logo for the login and sidebar
        // You may wish to do this due to the color of the logo and contrast with the background color
        // Here is an example with svgs and with pngs
        // login: "dist/img/logo-dark.svg",
        // sidebar: "dist/img/logo-light.svg",
        login: "dist/img/logos/HSI-LOGO-WHITE.webp",
        sidebar: "dist/img/logos/HSI-LOGO-WHITE.webp",
        // By default the login screen will show a static cover image
        // You can change it to a different image here.
        loginCover: "dist/img/HSI-Background.webp",
        // You can use a series of images instead of a static cover image by enabling the carousel
        // These will fade into the next image every 'interval' seconds
        // You may use as many as you want but the more you use the longer the page will take to load
        carousel: {
            enabled: false,
            interval: 7.5,
            images: [
                "dist/img/carousel-1.jpg",
                "dist/img/carousel-2.jpg",
                "dist/img/carousel-3.jpg",
                "dist/img/carousel-4.jpg",
            ],
        }
    },
    styles: {
        text: {
            font: "Roboto",
            size: "16px",
            color: "#D1D1D1",
            lineHeight: "1.8",
        },
        heading: {
            font: "Inter",
            size: "3.4rem",
            color: "white",
            weight: "500",
            lineHeight: "1.2",
        },
        caption: {
            font: "Inter",
            size: "1rem",
            color: "white",
            weight: "400",
        },
        color: {
            primary: "#FCCC0E",
            secondary: "#161616",
            background: "#1c1c1c",
            icon: "#FCCC0E",
            focus: "#FCCC0E",
        },
        sidebar: {
            background: "#161616",
            width: "18em",
            logoPadding: "1em",
            textColor: "white",
        },
        loginForm: {
            background: "#161616",
            padding: "1em",
        },
        button: {
            radius: "0",
            color: "#FCCC0E",
        },
        logo: {
            width: "438px"
        },
        projectCard: {
            background: "#161616",
            margin: "16px",
        },
        inputRadius: "0",
    }
};
