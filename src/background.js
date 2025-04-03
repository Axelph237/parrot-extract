const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;
const actionAPI = browserAPI.action || browserAPI.browserAction;

// Use the detected API
actionAPI.onClicked.addListener(async (tab) => {
    console.log("Clicked");
    await browserAPI.tabs.sendMessage(tab.id, {
        action: "manageToolbar",
        publicURL: browserAPI.runtime.getURL("public")
    });
});




