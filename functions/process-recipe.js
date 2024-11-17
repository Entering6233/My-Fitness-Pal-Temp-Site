const Tesseract = require('tesseract.js');

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
                    logger: m => console.log(m) // Add logging for debugging
                }
            );

            const text = result.data.text;

            // For testing, return immediate success
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "Recipe processed successfully",
                    recipeUrl: `${process.env.URL}/recipe/test123`,
                    instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL",
                    debug: { textLength: text.length, firstFewChars: text.substring(0, 100) }
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