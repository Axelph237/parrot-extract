let content;

document.getElementById("extractBtn").addEventListener("click", async () => {
    const selector = document.getElementById("selectorInput").value;
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [selector],
        func: extractText
    })
})

function extractText(selector) {
    let frame;
    if (selector) {
        frame = document.querySelector(selector);
    }
    else {
        frame = document;
    }

    try {
        let headingsAndParagraphs = frame.querySelectorAll("h1, h2, h3, p");
        content = Array.from(headingsAndParagraphs)
            .map(el => el.innerText)
            .join('\n');

        chrome.runtime.sendMessage({ action: "displayContent", data: content });
    }
    catch (e) {
        console.error("Error accessing frame content:", e);
        chrome.runtime.sendMessage({ action: "displayContent", data: "Could not access element content." });
    }
}

// Display extracted text
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "displayContent") {
        const contentElement = document.getElementById("content");
        contentElement.innerText = message.data;

        console.log("Ripped content:", message.data);

        const copyBtn = document.getElementById("copyBtn");
        copyBtn.disables = !message.data;
        copyBtn.style.visibility = message.data ? "visible" : "hidden";
    }
})

// Copy extracted text to clipboard
document.getElementById("copyBtn").addEventListener("click", () => {
    const content = document.getElementById("content").innerText;
    if (content) {
        navigator.clipboard.writeText(content).then(() => {
            console.log("Content updated")
        }).catch((e) => {
            console.error("Failed to copy text:", e);
            alert("Failed to copy data.");
        });
    }
    else {
        alert("No text to copy.")
    }
})