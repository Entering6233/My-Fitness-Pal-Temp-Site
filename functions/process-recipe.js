const Tesseract = require('tesseract.js');
const { getStore } = require('@netlify/edge-functions');
const crypto = require('crypto');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid request format'
                })
            };
        }

        if (!body.image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'No image data provided'
                })
            };
        }

        // Create image buffer from base64
        let imageBuffer;
        try {
            imageBuffer = Buffer.from(body.image, 'base64');
        } catch (e) {
            console.error('Buffer Creation Error:', e);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid image data'
                })
            };
        }

        // Process with Tesseract
        try {
            const result = await Tesseract.recognize(
                imageBuffer,
                'eng',
                {
                    logger: m => console.log(m)
                }
            );

            const text = result.data.text;

            // Generate unique ID
            const uniqueId = crypto.randomBytes(8).toString('hex');
            
            // Create recipe object
            const recipe = {
                id: uniqueId,
                text: text,
                created: Date.now(),
                expires: Date.now() + (10 * 60 * 1000), // 10 minutes from now
                nutrition: {
                    calories: 300, // placeholder values
                    protein: 20,
                    carbs: 30,
                    fat: 10
                }
            };

            // Store recipe with expiration
            const store = getStore('recipes');
            await store.set(uniqueId, JSON.stringify(recipe), { 
                ttl: 600 // 10 minutes in seconds
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Recipe processed successfully",
                    recipeUrl: `${process.env.URL}/recipe/${uniqueId}`,
                    instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL (Link expires in 10 minutes)",
                    expiresIn: "10 minutes"
                })
            };

        } catch (e) {
            console.error('Tesseract Error:', e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Error processing image with OCR'
                })
            };
        }

    } catch (error) {
        console.error('General Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
}; 