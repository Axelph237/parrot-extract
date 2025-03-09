// Handles the sidebar opening and closing
let toolbarOpen = false;
let iframeDocRef = undefined;
let content = undefined;

chrome.runtime.onMessage.addListener((request) => {
    toolbarOpen = !toolbarOpen;
    if (toolbarOpen) {
        // Open
        openToolbar(request.publicURL);

        watchIFrames(request.publicURL);
    }
    else {
        unwatchIFrames();

        // Close
        removeToolbar();
    }
})

// ---- UI FUNCTION ----
//
//
/**
 * Adds the toolbar to the DOM
 * @param publicURL - The url to all public resources of the extension
 */
function openToolbar(publicURL) {
    // Check if the element already exists
    if (document.getElementById("parrot_toolbar")) {
        return;
    }

    // Inner toolbar HTML
    const parrot_html = `
    <html lang="en">
        <head>
            <title>Parrot Toolbar</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
            <link href="${publicURL}/toolbar.css" rel="stylesheet"/>
            <style>
                body {
                    margin: 0;
                    padding: 0 6px 6px;
                    overflow: hidden;
                    
                    width: fit-content;
                    height: fit-content;
                }
            </style>
        </head>
        <body>
            <div id="parrot_toolbar">
                <img src="${publicURL}/icon48.png" id="parrot_logo" width="32" height="32" alt="parrot logo" />
                <div id="parrot_buttons">
                    <button id="parrot_selectBtn" class="parrot_btn">
                        <img src="${publicURL}/pointer.svg" alt="select" width="20" height="20"/>
                    </button>
                    <button id="parrot_copyBtn" class="parrot_btn">
                        <img src="${publicURL}/copy.svg" alt="select" width="20" height="20"/>
                    </button>
                </div>
            </div>
        </body>
    </html>   
    `;

    // Create a new iframe
    let iframe = document.createElement("iframe");
    iframe.id = "parrot_iframe";
    iframe.classList.add("parrot_iframeWatched");
    iframe.srcdoc = parrot_html;
    iframe.style.visibility = "hidden";

    iframe.onload = () => {
        iframeDocRef = iframe.contentDocument || iframe.contentWindow.document;

        const resizeIFrame= () => {
            console.log("resizing iframe");
            iframe.style.width = iframeDocRef.body.scrollWidth + "px";
            iframe.style.height = iframeDocRef.body.scrollHeight + "px";
        }
        resizeIFrame(); // Resize once, then set mutation observer
        const observer = new MutationObserver(resizeIFrame);
        observer.observe(iframeDocRef, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["style"]
        })

        // Display toolbar for use
        iframe.style.visibility = "visible";

        // -- Button listeners
        // Selection action
        iframeDocRef.getElementById("parrot_selectBtn").addEventListener("click", () => {
            selecting = !selecting;
            if (!selecting && highlightedElement) {
                highlightedElement.classList.remove("parrot_hover-highlight");
                highlightedElement = undefined;
            }
        });

        // Toolbar controls
        iframeDocRef.getElementById("parrot_logo").addEventListener("click", () => {
            const buttons = iframeDocRef.getElementById("parrot_buttons");
            buttons.style.display = buttons.style.display === "flex" ? "none" : "flex";
        });

        // Copy action
        iframeDocRef.getElementById("parrot_copyBtn").addEventListener("click", handleCopy);

        // Tooltips
        let holdTimeout;
        const holdDelay = 650;
        iframeDocRef.getElementById("parrot_selectBtn").addEventListener("mouseenter", (event) => {
            if (!holdTimeout) {
                holdTimeout = setTimeout(() => {
                    displayTooltip("select", event.target);
                    holdTimeout = null;
                }, holdDelay);
            }
        });
        iframeDocRef.getElementById("parrot_selectBtn").addEventListener("mouseleave", (event) => {
            if (holdTimeout) {
                clearInterval(holdTimeout);
                holdTimeout = null;
            }
            else
                removeTooltip("select", event.target);
        });

        iframeDocRef.getElementById("parrot_copyBtn").addEventListener("mouseenter", (event) => {
            if (!holdTimeout) {
                holdTimeout = setTimeout(() => {
                    displayTooltip("copy text", event.target);
                    holdTimeout = null;
                }, holdDelay);
            }
        });
        iframeDocRef.getElementById("parrot_copyBtn").addEventListener("mouseleave", (event) => {
            if (holdTimeout) {
                clearInterval(holdTimeout);
                holdTimeout = null;
            }
            else
                removeTooltip("copy text", event.target);
        });

        displayAlert("hello!");
    }
    // Select element action
    window.addEventListener("click", handleClick);

    // Highlight actions
    document.addEventListener("mousemove", handleHighlight);
    document.addEventListener("mouseout", handleUnhighlight);

    const observer = new MutationObserver(() => {
        watchIFrames(publicURL);
    });
    observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: false
    })

    // Add toolbar to DOM
    document.body.appendChild(iframe);
}

/**
 * Removes the toolbar from the DOM
 */
function removeToolbar() {
    const toolbar = document.getElementById("parrot_iframe")

    document.body.removeChild(toolbar);
}

// ---- HIGHLIGHT FUNCTIONS ----
//
//
let selecting = false;
let highlightedElement = undefined;

function watchIFrames(publicURL) {
    console.log("watching iframes");
    const iframes = document.querySelectorAll("iframe");

    for (let i = 0; i < iframes.length; i++) {
        try {
            let iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
            // Exclude watched iframes
            if (iframeDoc.body.classList.contains("parrot_iframeWatched")) continue;

            iframeDoc.body.classList.add("parrot_iframeWatched");
            iframeDoc.addEventListener("mouseover", handleHighlight);
            iframeDoc.addEventListener("mouseout", handleUnhighlight);
            iframeDoc.addEventListener("click", handleClick);

            // Inject highlight.css into iframe
            const styles = iframeDoc.createElement("link");
            styles.rel = "stylesheet";
            styles.href = publicURL + "/highlight.css";
            iframeDoc.head.appendChild(styles);
        } catch (error) {
            console.warn("Cross-origin iframe: Cannot access content.");
        }
    }
}

function unwatchIFrames() {
    const iframes = document.querySelectorAll("iframe");

    for (let i = 0; i < iframes.length; i++) {
        if (iframes[i].id === "parrot_iframe") continue; // Skip toolbar

        try {
            let iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
            iframeDoc.removeEventListener("mouseover", handleHighlight);
            iframeDoc.removeEventListener("mouseout", handleUnhighlight);
            iframeDoc.removeEventListener("click", handleClick);
        } catch (error) {
            console.warn("Cross-origin iframe: Cannot access content.");
        }
    }
}

const handleHighlight = (event) => {
    if (!selecting) return;
    if (event.target.id.includes("parrot_")) return;
    // Remove current highlight
    if (highlightedElement) {
        highlightedElement.classList.remove("parrot_hover-highlight");
    }

    // Highlight new element
    highlightedElement = event.target;
    highlightedElement.classList.add("parrot_hover-highlight");
}

const handleUnhighlight = () => {
    if (!selecting) return;
    // Remove highlight on mouse out
    if (highlightedElement) {
        highlightedElement.classList.remove("parrot_hover-highlight");
        highlightedElement = null;
    }
}

const handleClick = () => {
    if (selecting && highlightedElement) {
        // Remove old selected divs
        const documents = getDocuments(document);

        for (let i = 0; i < documents.length; i++) { // the number of documents in a page is presumably low
            let selectedElems = documents[i].getElementsByClassName("parrot_selected-highlight");
            // and the number of selectedElems should never be > 0
            // but this is a failsafe in case there somehow are
            for (let i = 0; i < selectedElems.length; i++) {
                selectedElems[i].classList.remove("parrot_selected-highlight");
            }
        }

        // Select current element
        highlightedElement.classList.remove("parrot_hover-highlight");
        highlightedElement.classList.add("parrot_selected-highlight");
        setContent(extractText(highlightedElement));

        selecting = false;
        highlightedElement = undefined;
    }
}

// ---- EXTRACT TEXT FUNCTIONS ----
//
//
/**
 * Gets the inner text from the target element.
 * @param target - the target element.
 * @returns {*} - the innerText of the element.
 */
function extractText(target) {
    // Once a more complex function.
    // Now that iframes can be individually targeted, much simpler.
    // Cannot extract from iframes WITHIN a selected div,
    // but this is not a necessary function.
    // Left as an independent function in case future functionality is added.

    return target.innerText;
}

/**
 * Attempts to copy the data from content to the user's clipboard.
 */
function handleCopy() {
    if (content) {
        navigator.clipboard.writeText(content).then(() => {
            // Copy success
            console.log("Content updated")
            displayAlert("copied!");
        }).catch((e) => {
            // Copy error
            console.error("Failed to copy text:", e);
            displayAlert("couldn't copy that");
        });
    }
    else {
        // No content to copy
        displayAlert("no text to copy");
    }
}

// ---- UTIL FUNCTIONS ----
//
//
/**
 * Gets all documents from the parent document, including the parent
 * @param parent - The parent document to get documents from
 */
function getDocuments(parent) {
    const documents = [parent];

    const iframes = parent.querySelectorAll("iframe");
    for (let i = 0; i < iframes.length; i++) {
        try {
            const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
            documents.push(iframeDoc);
        }
        catch (e) {
            console.warn("Parrot failed to retrieve iframe document:\n", e);
        }
    }

    return documents;
}

/**
 * Sets the content value, then updates the copy button display based on the content.
 * @param text - The value to set content to
 */
function setContent(text) {
    content = text;

    iframeDocRef.getElementById("parrot_copyBtn").style.display = content ? "flex" : "none";
}

// ---- NOTIFICATION FUNCTIONS ----
//
//

/**
 * Displays a tooltip element with the given message about the source element.
 * Note: the tooltip is placed in the base DOM, rather than the iframe to avoid clipping and
 * unnecessarily resizing toolbar iframe.
 * @param msg - the message to display.
 * @param source - the element in the iframeDoc where the tooltip should be placed.
 * @return {*} - the tooltip element created.
 */
function displayTooltip(msg, source) {
    if (!source || !iframeDocRef.body) return;

    if (document.getElementById("parrot_tooltip-" + msg + "-" + source.id)) return;

    const yOffset = 35;

    const tooltip = document.createElement("div");
    tooltip.id = "parrot_tooltip-" + msg + "-" + source.id;
    tooltip.classList.add("parrot_tooltip");
    tooltip.innerText = msg;

    const sourceDims = source.getBoundingClientRect();
    const iframeDims = document.getElementById("parrot_iframe").getBoundingClientRect();
    tooltip.style.left = (sourceDims.left + iframeDims.left + (sourceDims.width / 2)) + "px";
    tooltip.style.top = (iframeDims.top - yOffset) + "px";

    document.body.appendChild(tooltip);

    return tooltip;
}

/**
 * Removes a tooltip displaying a particular message from the DOM.
 * @param msg - the message the tooltip to remove is displaying.
 * @param source - the source element of the tooltip.
 */
function removeTooltip(msg, source) {
    const tooltip = document.getElementById("parrot_tooltip-" + msg + "-" + source.id);
    if (tooltip) document.body.removeChild(tooltip);
}

/**
 * Alerts only come from the logo.
 */
function displayAlert(msg) {
    if (!msg) return;

    const n = document.getElementsByClassName("parrot_alert").length;

    const logo = iframeDocRef.getElementById("parrot_logo");
    const yOffset = 35;

    const alert = document.createElement("div");
    alert.id = "parrot_alert-" + n;
    alert.classList.add("parrot_alert");
    alert.classList.add("parrot_open");
    alert.innerText = msg;

    const logoDims = logo.getBoundingClientRect();
    const iframeDims = document.getElementById("parrot_iframe").getBoundingClientRect();
    alert.style.left = (logoDims.left + iframeDims.left + (logoDims.width / 2)) + "px";
    alert.style.top = (iframeDims.top - yOffset) + "px";

    document.body.appendChild(alert);

    wobbleAnim(logo);

    setTimeout(() => {
        exhaustAlert(alert);
    }, 1500);

    return alert;
}

function exhaustAlert(alert) {
    if (alert) {
        alert.classList.remove("parrot_open");
        alert.offsetHeight;
        alert.classList.add("parrot_close");
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 500);
    }
}

function wobbleAnim(elem) {
    elem.classList.add("parrot_wobble");
    setTimeout(() => {
        elem.classList.remove("parrot_wobble");
    }, 600)
}