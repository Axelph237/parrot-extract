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
    } else {
        frame = document;
    }

    try {
        // Extract text from main document
        let headingsAndParagraphs = frame.querySelectorAll("h1, h2, h3, p");
        let content = Array.from(headingsAndParagraphs)
            .map(el => el.innerText)
            .join('\n');

        // Try to extract text from all accessible iframes
        let iframes = document.querySelectorAll("iframe");
        let iframePromises = Array.from(iframes).map(iframe => {
            return new Promise(resolve => {
                try {
                    let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    let iframeText = Array.from(iframeDoc.querySelectorAll("h1, h2, h3, p"))
                        .map(el => el.innerText)
                        .join('\n');
                    resolve(iframeText);
                } catch (e) {
                    console.warn("Could not access iframe:", e);
                    resolve(""); // Prevent failure from stopping extraction
                }
            });
        });

        // Wait for all iframe extractions to complete
        Promise.all(iframePromises).then(iframeContents => {
            let fullContent = content + "\n" + iframeContents.join("\n");
            chrome.runtime.sendMessage({ action: "displayContent", data: fullContent });
        });

    } catch (e) {
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