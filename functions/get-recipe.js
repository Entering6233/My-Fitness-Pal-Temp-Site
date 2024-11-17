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
            <title>${recipe.name || 'Recipe'}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            <h1>${recipe.name || 'Recipe'}</h1>
            
            <div class="ingredients">
                <h2>Ingredients:</h2>
                <ul>
                    ${recipe.ingredients.map(ing => 
                        `<li>${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}</li>`
                    ).join('') || '<li>No ingredients found</li>'}
                </ul>
            </div>

            <div class="original-text">
                <h2>Original Text:</h2>
                <pre>${recipe.originalText || 'No text available'}</pre>
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
            body: `
                <html>
                    <body>
                        <h1>Error</h1>
                        <p>Sorry, there was an error displaying this recipe.</p>
                        <p>Error details: ${error.message}</p>
                    </body>
                </html>
            `
        };
    }
}; 