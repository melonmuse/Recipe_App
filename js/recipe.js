//Getting recipes from localStorage
function getRecipes() {
    const saved = localStorage.getItem('cooknote_recipes');
    return JSON.parse(saved) || [];
}

//Getting one recipe by its id
function getRecipe(id) {
    return getRecipes().find(r => r.id === id);
}

//Show error messages
function showMessage(text, type) {
    const messageBox = document.getElementById('message');
    messageBox.textContent = text;
    messageBox.className = 'message ' + type;
    messageBox.hidden = false;
}

//Unit sizes in grams (weight) or millilitres (volume)
const UNITS = {
    weight: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
    volume: { ml: 1, L: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 }
};

//Find which group a unit belongs to
function getCategory(unit) {
    if (unit in UNITS.weight) return 'weight';
    if (unit in UNITS.volume) return 'volume';
    return null;    // for non-unit items
}

//Convert a quantity and round to 2 decimal places
function convert(quantity, fromUnit, toUnit) {
    const category = getCategory(fromUnit);
    const factors = UNITS[category];
    const result = quantity * (factors[fromUnit] / factors[toUnit]);
    return Math.round(result * 100) / 100;
}

//Pick a US unit for a metric measurement
function toUS(quantity, unit) {
    if (unit === 'g' || unit === 'kg') {
        const grams = quantity * UNITS.weight[unit];
        const target = grams >= 453.592 ? 'lb' : 'oz';      
        return { quantity: convert(quantity, unit, target), unit: target };
    }
    if (unit === 'ml' || unit === 'L') {
        const ml = quantity * UNITS.volume[unit];
        let target = 'tsp';
        if (ml >= 59.15) target = 'cup';                     
        else if (ml >= 14.79) target = 'tbsp';               
        return { quantity: convert(quantity, unit, target), unit: target };
    }
    return { quantity: quantity, unit: unit };               
}

//Pick a metric unit for a US measurement
function toMetric(quantity, unit) {
    if (unit === 'oz' || unit === 'lb') {
        const grams = quantity * UNITS.weight[unit];
        const target = grams >= 1000 ? 'kg' : 'g';           
        return { quantity: convert(quantity, unit, target), unit: target };
    }
    if (unit === 'cup') {
        const ml = quantity * UNITS.volume[unit];
        const target = ml >= 1000 ? 'L' : 'ml';              
        return { quantity: convert(quantity, unit, target), unit: target };
    }
    return { quantity: quantity, unit: unit };            
}

//Find which recipe to show from the address
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const recipe = getRecipe(id);

//Draw the ingredients in the chosen system: 'original', 'metric' or 'us'
function drawIngredients(system) {
    const list = document.getElementById('recipe_ingredients');
    list.innerHTML = '';

    for (let i = 0; i < recipe.ingredients.length; i++) {
        const ing = recipe.ingredients[i];
        let shown = { quantity: ing.quantity, unit: ing.unit };   // original

        if (system === 'us') shown = toUS(ing.quantity, ing.unit);
        if (system === 'metric') shown = toMetric(ing.quantity, ing.unit);

        const li = document.createElement('li');
        li.textContent = shown.quantity + ' ' + shown.unit + ' ' + ing.name;
        list.appendChild(li);
    }
}

//Switch systems and highlight the selected button
function setSystem(system, button) {
    drawIngredients(system);
    document.querySelectorAll('.unit-toggle button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
}

//Show the recipe
if (!recipe) {
    showMessage('Recipe not found.', 'error');
} else {
    document.getElementById('recipe_title').textContent = recipe.title;

    const stepsList = document.getElementById('recipe_steps');
    for (let i = 0; i < recipe.steps.length; i++) {
        const li = document.createElement('li');
        li.textContent = recipe.steps[i];
        stepsList.appendChild(li);
    }

    drawIngredients('original');

    //Unit buttons
    document.getElementById('original_btn').addEventListener('click', function() { setSystem('original', this); });
    document.getElementById('metric_btn').addEventListener('click', function() { setSystem('metric', this); });
    document.getElementById('us_btn').addEventListener('click', function() { setSystem('us', this); });
}