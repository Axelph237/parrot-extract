let parrot_highlightedElement = undefined;

document.addEventListener("mouseover", (event) => {
    // Remove current highlight
    if (parrot_highlightedElement) {
        parrot_highlightedElement.classList.remove("hover-highlight");

    }

    // Highlight new element
    parrot_highlightedElement = event.target;
    parrot_highlightedElement.classList.add("hover-highlight");
    console.log("Content highlighted", parrot_highlightedElement);
});

document.addEventListener("mouseout", () => {
    // Remove highlight on mouse out
    if (parrot_highlightedElement) {
        parrot_highlightedElement.classList.remove("hover-highlight");
        parrot_highlightedElement = null;
    }
});