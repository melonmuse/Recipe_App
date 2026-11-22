# CookNote: AI Recipe Book

## Team Members
1. Abeer Issa Abu Shiekah
2. Mizuki Shinoda

## Problem
Many people struggle with their daily meal planning, searching for recipes, or sharing them with family, friends, or a community as recipes are scattered across social media, food content creators can't afford their own websites, and people struggle to decide what to cook with what they have. This prototype is a stepping stone to a full-fledged website that can provide all these functionalities in a centralized place and without a paywall like some of the competitors' websites.

## Key Features
This prototype focuses on three use cases from our application, which are uploading recipes, converting measurements, and providing AI-generated recipes using the Gemini API.

## Technologies
This project was built using HTML, CSS, and JavaScript for client-side-only web development, along with localStorage to save recipes (just for this prototype) and the Gemini API to perform the AI recipe generation.

## Prerequisites
A stable internet connection and an up-to-date web browser.

## Installation
This prototype requires no installation and is accessible through the GitHub public page: https://melonmuse.github.io/Recipe_App/

## Configuration
None

## How to Run
1. Open the website and you will be greeted with the home page.
2. Click on Upload Recipe in the navigation bar to upload your first recipe.
3. Fill in the details of the recipe title, ingredients (with quantity, unit, and item name), and instructions. Click upload to save the recipe or cancel to discard and start over.
4. Navigate back to the home page. Under "My Recipes", a list of all recipes uploaded by you will be available for access. Click on a recipe of your choosing and you will be greeted with a full page of the recipe.
5. The recipe will display the title of the recipe, ingredients, and instructions as uploaded. There is an option above the ingredients section to switch measurements between original, metric, and imperial.
6. Return to the home page to find the AI Recipe Suggestion card, where you can input your available ingredients and, optionally, dietary preferences. Once you click "Generate Recipe", a recipe will be displayed with your available ingredients. The more ingredients you include, the better the result!

## How to Assess
- [ ] Enter recipe details in the form. The form should be able to identify missing titles, quantities (or quantities equal to or less than 0), units, ingredient items, and instructions.
- [ ] Open a recipe from the saved recipes and test the conversion between original, metric, and imperial. For example, test to see if an original 200 g shows as 200 g in metric and 7 oz in imperial.
- [ ] Use the AI Recipe generator with a dietary restriction and without, which should work either way. Then test the AI Recipe Generator with ingredients and no ingredients, where the latter produces an error.