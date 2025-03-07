async function init() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const publicURL = chrome.runtime.getURL("public");

    // Inject element into webpage
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [publicURL],
        func: createSidebar,
    })

    // Inject css into webpage
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/toolbar.css"]
    })
}
init();

function createSidebar(publicURL) {
    const parrot_html = `
    <div id="parrot_app">
        <img src="${publicURL}/icon48.png" id="parrot_logo" width="32" height="32" alt="parrot logo" />
        <input id="parrot_selectInput" class="parrot_input" type="text" placeholder="Selector" />
        <button id="parrot_selectBtn" class="parrot_btn">select</button>
    </div>
    `;
    // Check if the element already exists
    if (document.getElementById("parrot_sidebar")) {
        return;
    }

    // Create a new div
    let sidebar = document.createElement("div");
    sidebar.id = "parrot_sidebar";
    sidebar.innerHTML = parrot_html;
    document.body.appendChild(sidebar);
}
