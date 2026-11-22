// ===================== API KEY =====================
const model = "gemini-3.8-flash";
const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

// Ask for the API key once and remember it in this browser only.
// Pass true to forget the saved key and ask again (e.g. when Google rejects it).
function getApiKey(askAgain = false) {
    if (askAgain) localStorage.removeItem('gemini_api_key');

    let key = localStorage.getItem('gemini_api_key');
    if (!key) {
        key = (prompt('Enter your Gemini API key (it is only saved in this browser):') || '').trim();
        if (!key) throw new Error('No API key entered.');
        localStorage.setItem('gemini_api_key', key);
    }
    return key;
}


// ===================== SETTINGS =====================

// Models to try, in order. If the first one is busy, the next one is used.
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

// Important conversions for imperical conversion
const GRAMS_PER_OZ = 28.35;
const ML_PER_CUP = 236.6;
const ML_PER_TBSP = 14.79;
const ML_PER_TSP = 4.93;

// ===================== START =====================
document.getElementById("generate_btn").addEventListener("click", generate);
loadRecipes();

// Ask for the API key when the page opens
try { getApiKey(); } catch (error) { console.log(error.message); }

// ===================== SAVED RECIPES =====================

// This removes a recipe by first of all getting all the recipes, filtering them by
// only showing the ones that don't match the deleted id, then saving the remaining
// in localStorage as a hard reset
function deleteRecipe(id) {
    const remaining = getRecipes().filter(r => r.id !== id);
    localStorage.setItem("cooknote_recipes", JSON.stringify(remaining));
}

// An important function to load all saved recipes from localStorage.
function loadRecipes() {
    // First it gets the values from localStorage and empties out the my_recipes section from the home page.
    // There is also a message when there are no recipes.
    const list = document.getElementById("my_recipes");
    const recipes = getRecipes();
    list.innerHTML = "";

    if (recipes.length === 0) {
        list.innerHTML = '<a style="text-align: center" href="add-recipe.html">Start uploading your recipes</a>';
        return;
    }

    // If there are, the system will loop through the localStorage and create an li for each recipe where it's content is
    // the recipe name, and the link if recipe.html?= + recipe.id (id was stored in storage). Then a delete button will be made next
    // to it that calls on deleteRecipe() then loadRecipes() again with the updated recipes and finally appending the li to the list
    recipes.forEach(recipe => {
        const li = document.createElement("li");

        const link = document.createElement("a");
        link.textContent = recipe.title;
        link.href = "recipe.html?id=" + recipe.id;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
            if (confirm('Delete "' + recipe.title + '"? This cannot be undone.')) {
                deleteRecipe(recipe.id);
                loadRecipes();
            }
        });

        li.append(link, " ", deleteBtn);
        list.appendChild(li);
    });
}


// ===================== AI RECIPE =====================

// This is the structure of the prompt that the system will send to Gemini to get the perfect response every single time
// that fits the format for loading and display the result
function buildPrompt(ingredients, diets) {
    let text = "Suggest ONE recipe using some or all of these ingredients: " + ingredients.join(", ") + ". ";
    if (diets.length > 0) {
        text += "The recipe must be: " + diets.join(", ") + ". ";
    }
    text += "Use only these units: g, ml, tsp, tbsp, piece, pinch. ";
    text += 'Reply ONLY with JSON in exactly this format: ';
    text += '{"title": "", "ingredients": [{"name": "", "quantity": 0, "unit": ""}], "steps": [""]}';
    return text;
}

// Ask one Gemini model for a recipe (gives up after 30 seconds)
async function askGemini(promptText, model, signal) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": getApiKey()
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" }
        }),
        signal: signal
    });

    const data = await response.json();

    if (data.error) {
        if (data.error.status === "PERMISSION_DENIED" || /api key/i.test(data.error.message)) {
            localStorage.removeItem('gemini_api_key'); // forget the bad key so the user is asked again next time
            throw new Error("The API key was not accepted.");
        }
        throw new Error(data.error.message);
    }

    return JSON.parse(data.candidates[0].content.parts[0].text);
}

// Try each model until one works
async function getAiRecipe(promptText) {
    const signal = AbortSignal.timeout(30000);
    let lastError;
    for (const model of MODELS) {
        try {
            return await askGemini(promptText, model, signal);
        } catch (error) {
            if (error.message.includes("API key")) throw error;
            console.log(model + " failed: " + error.message);
            lastError = error;
        }
    }
    throw lastError;
}

// Small helper function to deal with US conversion to convert mL to cup
// tbsp, or tsp based on how much mL there is
function usVolume(ml) {
    if (ml >= 240) return `${Math.round(ml / ML_PER_CUP)} cup`;
    if (ml >= 15)  return `${Math.round(ml / ML_PER_TBSP)} tbsp`;
    return `${Math.round(ml / ML_PER_TSP)} tsp`;
}

// Gemini output of ingredients that includes all metric and imperial units
// Or the original like piece or pinch
function ingredientText(ing) {
    const { name, quantity, unit } = ing;

    if (unit === "g")  return `${quantity} g (${Math.round(quantity / GRAMS_PER_OZ)} oz) ${name}`;
    if (unit === "kg") return `${quantity} kg (${Math.round(quantity * 1000 / GRAMS_PER_OZ)} oz) ${name}`;
    if (unit === "ml") return `${quantity} ml (${usVolume(quantity)}) ${name}`;
    if (unit === "L")  return `${quantity} L (${usVolume(quantity * 1000)}) ${name}`;
    if (unit === "piece") return `${quantity} ${name}`;
    return `${quantity} ${unit} ${name}`;
}


// Same thing as before, clearing a list and looping through
// the items to create an element, make the item the content
// and then append it to the list
function fillList(listId, items) {
    const list = document.getElementById(listId);
    list.innerHTML = "";
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
}

// Displaying the AI recipe ingreidents and steps using the fillList function
function showAiRecipe(recipe) {
    document.getElementById("ai_title").textContent = recipe.title;
    fillList("ai_recipe_ingredients", recipe.ingredients.map(ingredientText));
    fillList("ai_recipe_steps", recipe.steps);
    document.getElementById("ai_result").hidden = false;
}

// "Generate Recipe" button. This allows for calling all the functions necassery to achieve
// the AI recipe generation
async function generate() {
    document.getElementById("ai_message").hidden = true;
    document.getElementById("ai_result").hidden = true;

    // Validation of inputs
    const ingredients = document.getElementById("ai_ingredients").value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    if (ingredients.length === 0) {
        showMessage("Please enter at least one ingredient.", "error", "ai_message");
        return;
    }

    // Retrieving user diet preferences
    const diets = [...document.querySelectorAll('input[name="diet"]:checked')].map(c => c.value);

    // While loading, the button is disabled and displays generating
    const button = document.getElementById("generate_btn");
    button.disabled = true;
    button.textContent = "Generating...";

    // Performs try-catch of showAIRecipe
    try {
        const recipe = await getAiRecipe(buildPrompt(ingredients, diets));
        showAiRecipe(recipe);
    } catch (error) {
        const message = error.name === "TimeoutError"
            ? "Google took longer than 30 seconds to answer."
            : error.message;
        showMessage("Could not get a recipe: " + message, "error", "ai_message");
    } finally {
        button.disabled = false;
        button.textContent = "Generate Recipe";
    }
}


