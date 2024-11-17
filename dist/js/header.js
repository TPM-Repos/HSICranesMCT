// fetch asynchronously dist/header.html
// it will return a parent element of <header>
// this header needs to be injected as the first child of <body>
// make sure body exists before injecting
{
// const URL = "dist/header.html";
const URL = "/dist/header-original.html";
// const HEADER_SELECTOR = "header";
const HEADER_SELECTOR = "[data-elementor-type='header']";

async function fetchHeader() {
    try {
        const response = await fetch(URL);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        return doc.querySelector(HEADER_SELECTOR);
    } catch (error) {
        console.error("Error fetching header:", error);
        return null;
    }
}

function injectHeader(header) {
    if (header) {
        document.body.prepend(header);
    }
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // const header = await fetchHeader();
    // injectHeader(header);
});
}