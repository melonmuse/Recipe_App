//API Key
const model = "gemini-3.8-flash";
const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

//Ask for the API key once and remember it in this browser only
function getApiKey() {
    let key = localStorage.getItem('gemini_api_key');
    if (!key) {
        key = prompt('Enter your Gemini API key (it is only saved in this browser):');
        if (!key) throw new Error('No API key entered.');
        key = key.trim();
        localStorage.setItem('gemini_api_key', key);
    }
    return key;
}

//Unit sizes in grams (weight) or millilitres (volume)
const UNITS = {
    weight: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
    volume: { ml: 1, L: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 }
};


// --------------------------- SAVED RECIPES ---------------------------

//Getting recipes from localStorage
function getRecipes() {
    const saved = localStorage.getItem('cooknote_recipes');
    return JSON.parse(saved) || [];
}

//Deleting a recipe from localStorage
function deleteRecipe(id) {
    const remaining = getRecipes().filter(r => r.id !== id);
    localStorage.setItem('cooknote_recipes', JSON.stringify(remaining));
}

//Showing the saved recipes on the page
function loadRecipes() {
    const list = document.getElementById('my_recipes');
    const recipes = getRecipes();
    list.innerHTML = '';

    if (recipes.length === 0) {
        list.innerHTML = '<li>No recipes yet. Start uploading your recipes <a href="add-recipe.html">here!</a>.</li>';
        return;
    }

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];

        const li = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = recipe.title;
        link.href = 'recipe.html?id=' + recipe.id;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Delete "' + recipe.title + '"? This cannot be undone.')) {
                deleteRecipe(recipe.id);
                loadRecipes();
            }
        });

        li.appendChild(link);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(deleteBtn);
        list.appendChild(li);
    }
}


//  ---------------------------  AI RECIPE  --------------------------- 

//Show messages in the AI section
function showAiMessage(text, type) {
    const messageBox = document.getElementById('ai_message');
    messageBox.textContent = text;
    messageBox.className = 'message ' + type;
    messageBox.hidden = false;
}

//Convert a quantity and round to 2 decimal places
function convert(quantity, fromUnit, toUnit, category) {
    const factors = UNITS[category];
    const result = quantity * (factors[fromUnit] / factors[toUnit]);
    return Math.round(result);
}

//Turn one ingredient into a line of text
function ingredientText(ing) {
    if (ing.unit === 'g' || ing.unit === 'kg') {
        const oz = convert(ing.quantity, ing.unit, 'oz', 'weight');
        return '(' + ing.quantity + ' ' + ing.unit + ' / ' + oz + ' oz) ' + ing.name;
    }
    if (ing.unit === 'ml' || ing.unit === 'L') {
        const cups = convert(ing.quantity, ing.unit, 'cup', 'volume');
        return '(' + ing.quantity + ' ' + ing.unit + ' / ' + cups + ' cup) ' + ing.name;
    }
    if (ing.unit === 'piece') {
        return ing.quantity + ' ' + ing.name;
    }
    return ing.quantity + ' ' + ing.unit + ' ' + ing.name;
}

//Write the message for the AI
function buildPrompt(ingredients, diets) {
    let prompt = 'Suggest ONE recipe using some or all of these ingredients: ' + ingredients.join(', ') + '. ';
    if (diets.length > 0) {
        prompt += 'The recipe must be: ' + diets.join(', ') + '. ';
    }
    prompt += 'Use only these units: g, ml, tsp, tbsp, piece, pinch. ';
    prompt += 'Reply ONLY with a JSON object in exactly this format: ';
    prompt += '{"title": "", "ingredients": [{"name": "", "quantity": 0, "unit": ""}], "steps": [""]}';
    return prompt;
}

//Send the prompt to Gemini and return the recipe object
async function askGemini(prompt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": getApiKey()
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingLevel: "low" }
                }
            }),
            signal: controller.signal
        });

        const data = await response.json();
        console.log(data);  

        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Google took longer than 30 seconds to answer.');
        }
        throw error;

    } finally {
        clearTimeout(timer);
    }
}

//Show the AI recipe
function showAiRecipe(recipe) {
    document.getElementById('ai_title').textContent = recipe.title;

    const ingredientsList = document.getElementById('ai_recipe_ingredients');
    ingredientsList.innerHTML = '';
    for (let i = 0; i < recipe.ingredients.length; i++) {
        const li = document.createElement('li');
        li.textContent = ingredientText(recipe.ingredients[i]);
        ingredientsList.appendChild(li);
    }

    const stepsList = document.getElementById('ai_recipe_steps');
    stepsList.innerHTML = '';
    for (let i = 0; i < recipe.steps.length; i++) {
        const li = document.createElement('li');
        li.textContent = recipe.steps[i];
        stepsList.appendChild(li);
    }

    document.getElementById('ai_result').hidden = false;
}

//Generate button
async function generate() {
    document.getElementById('ai_message').hidden = true;
    document.getElementById('ai_result').hidden = true;

    //Ingredients typed as "chicken, rice, tomato"
    const ingredients = document.getElementById('ai_ingredients').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '');

    if (ingredients.length === 0) {
        showAiMessage('Please enter at least one ingredient.', 'error');
        return;
    }

    //Ticked dietary checkboxes
    const diets = [];
    document.querySelectorAll('input[name="diet"]:checked').forEach(c => diets.push(c.value));

    const button = document.getElementById('generate_btn');
    button.disabled = true;
    button.textContent = 'Generating...';

    try {
        const recipe = await askGemini(buildPrompt(ingredients, diets));
        showAiRecipe(recipe);
    } catch (error) {
        console.log(error);
        //Shows Google's reason (e.g. bad key) so you can see what went wrong
        showAiMessage('Could not get a recipe: ' + error.message, 'error');
    }

    button.disabled = false;
    button.textContent = 'Generate Recipe';
}


//--------------- START ---------------
document.getElementById('generate_btn').addEventListener('click', generate);
loadRecipes();