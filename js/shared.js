// Function to get recipe from localStorage
function getRecipes() {
    const saved = localStorage.getItem('cooknote_recipes');
    return JSON.parse(saved) || [];
}

// Show a message box (errors, success, cancel).
// text: the message to show
// type: 'error', 'success' or 'cancel' (matches the CSS classes)
// elementId: id of the message box in the HTML (defaults to 'message')
function showMessage(text, type, elementId = 'message') {
    const messageBox = document.getElementById(elementId);
    if (!messageBox) {
        console.warn('showMessage: no element with id "' + elementId + '"');
        return;
    }
    messageBox.textContent = text;
    messageBox.className = 'message ' + type;
    messageBox.hidden = false;
}

// Unit conversion
const GRAMS_PER = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const ML_PER = { ml: 1, L: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 };