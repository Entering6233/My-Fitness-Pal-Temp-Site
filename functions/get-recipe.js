exports.handler = async function(event, context) {
    try {
        const recipeId = event.path.split('/').pop();
        
        // Simple test response
        const recipe = {
            name: "Test Recipe",
            nutrition: {
                calories: 300,
                protein: 20,
                carbs: 30,
                fat: 10
            }
        };

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${recipe.name}</title>
            <meta name="description" content="Recipe nutrition information">
            <meta property="og:type" content="recipe">
            <meta property="og:title" content="${recipe.name}">
            <meta property="og:site_name" content="Recipe Tracker">
            <meta property="nutrition:calories" content="${recipe.nutrition.calories}">
            <meta property="nutrition:protein" content="${recipe.nutrition.protein}">
            <meta property="nutrition:carbohydrates" content="${recipe.nutrition.carbs}">
            <meta property="nutrition:fat" content="${recipe.nutrition.fat}">
        </head>
        <body>
            <h1>${recipe.name}</h1>
            <div class="nutrition">
                <h2>Nutrition Information (per serving):</h2>
                <ul>
                    <li>Calories: ${recipe.nutrition.calories}</li>
                    <li>Protein: ${recipe.nutrition.protein}g</li>
                    <li>Carbohydrates: ${recipe.nutrition.carbs}g</li>
                    <li>Fat: ${recipe.nutrition.fat}g</li>
                </ul>
            </div>
        </body>
        </html>
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: html
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Internal Server Error</h1>'
        };
    }
}; 