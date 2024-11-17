const { getStore } = require('@netlify/edge-functions');

exports.handler = async function(event, context) {
    try {
        const recipeId = event.path.split('/').pop();
        const store = getStore('recipes');
        const recipeData = await store.get(recipeId);

        if (!recipeData) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: `
                    <html>
                        <body>
                            <h1>Recipe Not Found</h1>
                            <p>This recipe link has expired or does not exist.</p>
                            <p>Recipe links expire after 10 minutes for security purposes.</p>
                        </body>
                    </html>
                `
            };
        }

        const recipe = JSON.parse(recipeData);
        
        // Check if expired
        if (Date.now() > recipe.expires) {
            // Clean up expired recipe
            await store.delete(recipeId);
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: `
                    <html>
                        <body>
                            <h1>Recipe Link Expired</h1>
                            <p>This recipe link has expired.</p>
                            <p>Please generate a new recipe link.</p>
                        </body>
                    </html>
                `
            };
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Recipe</title>
            <meta name="description" content="Recipe nutrition information">
            <meta property="og:type" content="recipe">
            <meta property="og:title" content="Recipe">
            <meta property="og:site_name" content="Recipe Tracker">
            <meta property="nutrition:calories" content="${recipe.nutrition.calories}">
            <meta property="nutrition:protein" content="${recipe.nutrition.protein}">
            <meta property="nutrition:carbohydrates" content="${recipe.nutrition.carbs}">
            <meta property="nutrition:fat" content="${recipe.nutrition.fat}">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .expiry { color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>Recipe Details</h1>
            
            <div class="expiry">
                <p>This link will expire in ${Math.round((recipe.expires - Date.now()) / 1000 / 60)} minutes</p>
            </div>

            <div class="nutrition">
                <h2>Nutrition Information (per serving):</h2>
                <ul>
                    <li>Calories: ${recipe.nutrition.calories}</li>
                    <li>Protein: ${recipe.nutrition.protein}g</li>
                    <li>Carbohydrates: ${recipe.nutrition.carbs}g</li>
                    <li>Fat: ${recipe.nutrition.fat}g</li>
                </ul>
            </div>

            <div class="recipe-text">
                <h2>Recipe Text:</h2>
                <pre>${recipe.text}</pre>
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
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: '<h1>Internal Server Error</h1>'
        };
    }
}; 