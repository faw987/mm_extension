// This runs in the context of the webpage
console.log("Content script loaded!");

// Access page content
const pageText = document.body.innerText;
console.log("Page Text:", pageText);

// Modify the page (e.g., add a button)
const button = document.createElement("button");
button.textContent = "Click Me!";
document.body.appendChild(button);