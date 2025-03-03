let parrot_highlightedElement = undefined;

const display = document.createElement("div")
display.id = "idDisplay";
document.body.appendChild(display);

const handleHighlight = (event) => {
    // Remove current highlight
    if (parrot_highlightedElement) {
        parrot_highlightedElement.classList.remove("hover-highlight");

    }

    // Highlight new element
    parrot_highlightedElement = event.target;
    parrot_highlightedElement.classList.add("hover-highlight");

    const elemRect = parrot_highlightedElement.getBoundingClientRect();
    const displayDiv = document.getElementById("idDisplay");
    displayDiv.innerText = `id: ${parrot_highlightedElement.id}\nclasses: ${parrot_highlightedElement.classList}`;
    displayDiv.style.top = elemRect.top + "px";
    displayDiv.style.left = elemRect.left + "px";
}

const handleUnhighlight = () => {
    // Remove highlight on mouse out
    if (parrot_highlightedElement) {
        parrot_highlightedElement.classList.remove("hover-highlight");
        parrot_highlightedElement = null;
    }
}

document.addEventListener("mouseover", handleHighlight);
document.addEventListener("mouseout", handleUnhighlight);