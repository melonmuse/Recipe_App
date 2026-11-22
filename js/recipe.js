// ===== 1. Loading data =====

// Read the recipe id from the address, e.g. recipe.html?id=abc123. This is the main method
// when the recipe page is open. When each recipe was saved, they are given a unique id which
// is reflected in their links. First retreive the unique id from the link (which looks like ?id=......)
// save that id, and then use getRecipe() to fetch a recipe with that matching id from localStorage
const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');
const recipe = getRecipe(recipeId);

if (!recipe) {
    showMessage('Recipe not found.', 'error', 'message');
} else {
    document.getElementById('recipe_title').textContent = recipe.title;
    showSteps(recipe);
    showIngredients(recipe, 'original');

    setupUnitButton(recipe, 'original_btn', 'original');
    setupUnitButton(recipe, 'metric_btn', 'metric');
    setupUnitButton(recipe, 'us_btn', 'us');
}

// Get one recipe by its id using the getRecipe() function by first getting all 
// the recipes, looping through them until an id matches, then return the match or null
function getRecipe(id) {
    const recipes = getRecipes();
    for (const recipe of recipes) {
        if (recipe.id === id) {
            return recipe;
        }
    }
    return null;
}

// ===== 2. Unit conversion =====

// Convert to imperial units. If a unit is in g or kg, it performs the necaserry conversion
// Same with mL and L but this time it converts to either tsp, cup, or tbsp depending on
// quanitity in mL. Anything else like tbsp, tsp, piece, pinch are returned as they are
function toUS(quantity, unit) {
    if (unit === 'g' || unit === 'kg') {
        const grams = quantity * GRAMS_PER[unit];
        return { quantity: Math.round(grams / GRAMS_PER.oz), unit: 'oz' };
    }

    if (unit === 'ml' || unit === 'L') {
        const ml = quantity * ML_PER[unit];

        let newUnit = 'tsp';
        if (ml >= 240) {
            newUnit = 'cup';
        } else if (ml >= 15) {
            newUnit = 'tbsp';
        }

        return { quantity: Math.round(ml / ML_PER[newUnit]), unit: newUnit };
    }

    return { quantity: quantity, unit: unit };
}

// Convert to metric units. If a unit it in oz or pounds, it performs the necassery conversion
// Same with cup to mL. Anything else like tbsp, tsp, piece, pinch are returned as they are
function toMetric(quantity, unit) {
    if (unit === 'oz' || unit === 'lb') {
        const grams = quantity * GRAMS_PER[unit];
        return { quantity: Math.round(grams), unit: 'g' };
    }

    if (unit === 'cup') {
        const ml = quantity * ML_PER.cup;
        return { quantity: Math.round(ml), unit: 'ml' };
    }

    return { quantity: quantity, unit: unit };
}


// ===== 3. Showing the recipe on the page =====

// Show the list of steps by getting steps from the saved object, creating a list tag, 
// adding the step to the list tag, and then appending it to the recipe_steps section in the
// HTML
function showSteps(recipe) {
    const stepsList = document.getElementById('recipe_steps');

    for (const step of recipe.steps) {
        const li = document.createElement('li');
        li.textContent = step;
        stepsList.appendChild(li);
    }
}

// Show the ingredients in the chosen system: 'original', 'metric' or 'us'
// First, get the section where ingredients are saved which is recipe_ingredients and empty it, 
// then get the ingredients from the object. Then, if system is US or Metric, their respective functions 
// are called or if it original, then it is left as it is. Then, create a list tag, add the ingreident in
// its chosen unit in the list tag, and then append it to the recipe_ingredients
function showIngredients(recipe, system) {
    const list = document.getElementById('recipe_ingredients');
    list.innerHTML = ''; 

    for (const ingredient of recipe.ingredients) {
        let shown = { quantity: ingredient.quantity, unit: ingredient.unit };

        if (system === 'us') {
            shown = toUS(ingredient.quantity, ingredient.unit);
        } else if (system === 'metric') {
            shown = toMetric(ingredient.quantity, ingredient.unit);
        }

        const li = document.createElement('li');
        li.textContent = shown.quantity + ' ' + shown.unit + ' ' + ingredient.name;
        list.appendChild(li);
    }
}

// When a unit button is clicked: redraw the ingredients and highlight that button.
// For example, if the button imperial is clicked, all them will have their class="active"
// be removed and the one that was selected getting the active tag. This allows for the orange highlight 
// to show the user which measurement unit system they are using (imperial, metric, original)
function setupUnitButton(recipe, buttonId, system) {
    const button = document.getElementById(buttonId);

    button.addEventListener('click', function () {
        showIngredients(recipe, system);

        const allButtons = document.querySelectorAll('.unit-toggle button');
        for (const otherButton of allButtons) {
            otherButton.classList.remove('active');
        }
        button.classList.add('active');
    });
}



