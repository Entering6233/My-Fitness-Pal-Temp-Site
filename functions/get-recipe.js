exports.handler = async function(event, context) {
    try {
        const params = new URLSearchParams(event.queryStringParameters);
        const recipeData = params.get('data');
        
        if (!recipeData) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: '<h1>Recipe Not Found</h1>'
            };
        }

        const recipe = JSON.parse(decodeURIComponent(recipeData));

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
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.6;
                }
                h1, h2 {
                    color: #333;
                }
                .ingredients {
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .nutrition {
                    background: #f0f7ff;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .original-text {
                    background: #fff;
                    padding: 20px;
                    border: 1px solid #eee;
                    border-radius: 5px;
                    margin: 20px 0;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>${recipe.name}</h1>
            
            <div class="recipe-info">
                <p>Servings: ${recipe.servings}</p>
            </div>

            <div class="ingredients">
                <h2>Ingredients:</h2>
                <ul>
                    ${recipe.ingredients.map(ing => 
                        `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`
                    ).join('')}
                </ul>
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

            <div class="original-text">
                <h2>Original Recipe Text:</h2>
                <pre>${recipe.originalText}</pre>
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