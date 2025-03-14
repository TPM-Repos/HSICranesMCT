// Version 1.2.0
/**
 * PROJECTS
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Render custom projects immediately
    renderCustomProjects();
    
    // Then try to get projects from API
    setTimeout(function() {
        startPageFunctions();
    }, 500);
});

/**
 * Render custom projects from config
 */
function renderCustomProjects() {
    try {
        const customProjects = config.projects.toAdd;
        if (customProjects && customProjects.length > 0) {
            renderProjects(customProjects);
        }
    } catch (error) {
        console.log("Error rendering custom projects:", error);
    }
}

/**
 * Start page functions.
 */
async function startPageFunctions() {
    const projectsList = document.getElementById("project-list");
    if (!projectsList) {
        console.log("Project list element not found");
        return;
    }

    try {
        if (typeof setCustomClientErrorHandler === 'function') {
            setCustomClientErrorHandler();
        }

        // Get Projects from API if client is available
        if (typeof client === 'undefined' || client === null) {
            console.log("Client not initialized, using custom projects only");
            return;
        }

        const groupAlias = localStorage.getItem("sessionAlias") || config.groupAlias;
        console.log("Getting projects for group:", groupAlias);
        
        let projects = await client.getProjects(groupAlias);
        console.log("Projects retrieved:", projects.length);

        // Remove hidden projects
        projects = projects.filter(project => !config.projects.toHide.includes(project.alias));

        // Add custom projects
        projects.push(...config.projects.toAdd);

        // (Optional) Order Projects alphabetically by alias
        const orderedProjects = sortProjectsByAlias(projects);

        // Render Projects
        renderProjects(orderedProjects);
    } catch (error) {
        console.log("Error loading projects from API:", error);
        // We already rendered custom projects, so no need to do it again
    }
}

/**
 * Render Projects to container.
 *
 * @param {Object} projects - ProjectData object.
 */
function renderProjects(projects) {
    const projectsList = document.getElementById("project-list");
    if (!projectsList) {
        console.log("Project list element not found");
        return;
    }

    // Clear loading state, show list
    projectsList.innerHTML = "";
    projectsList.style.opacity = "";

    // Empty state
    if (!projects || !projects.length) {
        projectsList.innerHTML = `
            <div class="empty-projects">
                <p>No Projects available.</p>
            </div>
        `;
        return;
    }

    // Loop out Projects
    for (let index = 0; index < projects.length; index++) {
        const project = projects[index];
        const name = project.alias || project.name;
        const description = project.description;
        let imagePath = null;
        // if the project doesn't have an id, it's a custom project. Default to placeholder if no image is provided
        imagePath = (project.id ? project.absoluteImagePath : project.image) ?? "dist/img/placeholder.png";

        const markup = `
            <div class="inner">
                <div class="project-image">
                    <div class="image" style="background-image: url('${imagePath}');"></div>
                </div>
                <h4 class="project-name">${name}</h4>
                ${
                    description &&
                    '<div class="project-description">' + description + "</div>"
                }
                <div class="project-action">Create</div>
            </div>
        `;

        // Create Project item
        const item = document.createElement("a");
        item.classList.add("project-item");
        item.style.setProperty("--index", index);
        if (project.id) {
            item.setAttribute("data-id", project.id);
        }
        if (project.name) {
            item.setAttribute("data-name", project.name);
        }
        // if the project doesn't have an id, it's a custom project. Use the link provided instead
        item.href = project.id ? `run.html?project=${project.name}` : project.link;
        item.title = "Create Specification: " + name;
        item.innerHTML = markup;

        projectsList.appendChild(item);

        // Animate entrance (hidden by default)
        item.classList.add("animate");
    }
}

/**
 * Order Projects alphabetically by alias - using name if unavailable.
 * @param {Object} projects - The unsorted Projects to order.
 */
function sortProjectsByAlias(projects) {
    return projects.sort((a, b) => {
        const nameA = a.alias || a.name;
        const nameB = b.alias || b.name;
        return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            caseFirst: "upper",
        });
    });
}

