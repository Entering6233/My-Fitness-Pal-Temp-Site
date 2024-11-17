const Tesseract = require('tesseract.js');
const crypto = require('crypto');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        if (!body.image) {
            throw new Error('No image data provided');
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(body.image, 'base64');

        // Process image with Tesseract
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: m => console.log(m)
            }
        );

        const text = result.data.text;
        
        // Parse recipe text
        const recipe = parseRecipeText(text);

        // Generate unique ID
        const uniqueId = crypto.randomBytes(8).toString('hex');
        
        // Store recipe data in function response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Recipe processed successfully",
                recipeUrl: `${process.env.URL}/recipe/${uniqueId}?data=${encodeURIComponent(JSON.stringify(recipe))}`,
                instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL (Link expires in 10 minutes)",
                expiresIn: "10 minutes"
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            })
        };
    }
};

function parseRecipeText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to find recipe name (usually first line)
    const name = lines[0]?.trim() || 'Untitled Recipe';
    
    // Look for servings
    const servingsMatch = text.match(/serves\s+(\d+)/i);
    const servings = servingsMatch ? parseInt(servingsMatch[1]) : 1;
    
    // Parse ingredients
    const ingredients = [];
    const nutritionInfo = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };
    
    // Simple ingredient parsing
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)/);
        
        if (match) {
            const amount = match[1];
            const unit = match[2];
            const ingredientName = match[3].trim();
            
            ingredients.push({
                amount,
                unit,
                name: ingredientName
            });

            // Add some estimated nutrition (you might want to use a proper nutrition API)
            nutritionInfo.calories += 50;  // placeholder values
            nutritionInfo.protein += 2;
            nutritionInfo.carbs += 5;
            nutritionInfo.fat += 2;
        }
    }

    return {
        name,
        servings,
        ingredients,
        nutrition: nutritionInfo,
        originalText: text
    };
} 