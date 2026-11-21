//Containers
const orderForm = document.getElementById('upload_form');
const itemsContainer = document.getElementById('ingredients_container');
const titleInput = document.getElementById('recipe_title');
const instructionsInput = document.getElementById('instructions');
const messageBox = document.getElementById('message');

// Shared attributes
let title = '';
let ingredients = [];
let steps = [];
let recipe = null;

//New row for ingredients
const newRowHTML = `
    <div class="form-row item-row">
    <input 
        type="number" 
        class="quantitySelect" 
        aria-label="Select quantity" 
        placeholder="Quantity" 
        min="0.1" 
        step="any"
    >
    <select class="unitSelect" aria-label="Select unit">
        <option value="" disabled selected>Select unit</option>
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="oz">oz</option>
        <option value="lb">lb</option>
        <option value="ml">ml</option>
        <option value="L">L</option>
        <option value="tsp">tsp</option>
        <option value="tbsp">tbsp</option>
        <option value="cup">cup</option>
        <option value="piece">piece</option>
        <option value="pinch">pinch</option>
    </select>
    <input type="text" class="itemSelect" aria-label="Ingredient name" placeholder="">
    <button type="button" class="remove-row" aria-label="Remove ingredient">✕</button>
    </div>`;

//Function to insert new rows
function addRow() {
    itemsContainer.insertAdjacentHTML('beforeend', newRowHTML);
}

//Call function to create a new row after loading
addRow();

// Add new rows automatically when the last row is fully filled
itemsContainer.addEventListener('change', function() {
    const allRows = itemsContainer.querySelectorAll('.item-row'); 
    const lastRow = allRows[allRows.length - 1]; 
    
    const lastQuantity = lastRow.querySelector('.quantitySelect').value; 
    const lastUnit = lastRow.querySelector('.unitSelect').value;
    const lastItem = lastRow.querySelector('.itemSelect').value; 

    if (lastItem && lastQuantity && lastUnit) {
    addRow();
    }
});

//Remove any rows
itemsContainer.addEventListener('click', function(event) {
    if (!event.target.classList.contains('remove-row')) return;
    const allRows = itemsContainer.querySelectorAll('.item-row');
    if (allRows.length > 1) {
        event.target.closest('.item-row').remove();
    } else {
        itemsContainer.innerHTML = '';
        addRow();
    }
});

//Show error messages
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'message ' + type;  
    messageBox.hidden = false;
}

// Handle form submission smoothly
orderForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (!handleErrors()) return;
    if (!saveRecipe()) return;
    submitForm();
});

function handleErrors() {
    // Reset from the last submission
    ingredients = [];
    orderForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    //Check there is a title
    title = titleInput.value.trim();
    if (!title) {
        titleInput.classList.add('invalid');
        showMessage("Enter a recipe title", 'error');
        return false;
    }

    //Check that there are ingredients and that all values are filled
    const allRows = itemsContainer.querySelectorAll('.item-row'); 

    for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const quantity = row.querySelector('.quantitySelect').value;
        const unit = row.querySelector('.unitSelect').value;
        const item = row.querySelector('.itemSelect').value;

        const hasAny = quantity || unit || item;
        const hasAll = quantity && unit && item;

        if (hasAny && !hasAll) {
        showMessage("Fill out quantity, unit, and items!", 'error');
        return false;
        }

        if(hasAll) {
        ingredients.push({ name: item, quantity: parseFloat(quantity), unit: unit });
        }
    }

    //Check there is at least one ingredient
    if (ingredients.length === 0) {
        showMessage("Add at least one ingredient", 'error');
        return false;
    }

    //Check instructions
    steps = instructionsInput.value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s !== '');

    if (steps.length === 0) {
        instructionsInput.classList.add('invalid');
        showMessage("Enter at least one instruction", 'error');
        return false;
    }

    return true;
}

//Saving to localStorage
function saveRecipe() {
    recipe = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: title,
        ingredients: ingredients,
        steps: steps,
        createdAt: new Date().toISOString()
    };

    try {
        const recipes = JSON.parse(localStorage.getItem('cooknote_recipes')) || [];
        recipes.push(recipe);
        localStorage.setItem('cooknote_recipes', JSON.stringify(recipes));
    } catch (err) {
        showMessage('Sorry, your recipe could not be saved. Storage may be full.', 'error');
        return false;
    }
    return true;
}


//Submission Complete
function submitForm() {
    orderForm.reset();
    itemsContainer.innerHTML = '';
    addRow();
    showMessage(`"${recipe.title}" has been uploaded! 😀`, 'success');
}


//Handle cancellation
document.getElementById('cancel_btn').addEventListener('click', function() {
    orderForm.reset();
    itemsContainer.innerHTML = '';
    addRow();
    showMessage(`Recipe has been discarded`, 'cancel');
});