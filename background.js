chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "displayContent") {
        chrome.tabs.sendMessage(sender.tab.id, message);
    }
})