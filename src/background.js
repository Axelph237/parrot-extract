chrome.action.onClicked.addListener(async (tab) => {
    await chrome.tabs.sendMessage(tab.id, { action: "manageToolbar", publicURL: chrome.runtime.getURL("public") });
})



