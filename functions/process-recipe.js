const crypto = require('crypto');
const { processImage } = require('./utils/imageProcessor');
const { cleanText } = require('./utils/textCleaner');
const { parseRecipe } = require('./utils/recipeParser');
const { buildSuccessResponse, buildErrorResponse } = require('./utils/responseBuilder');

exports.handler = async function(event, context) {
    try {
        console.log('Starting process...');

        const body = JSON.parse(event.body);
        if (!body.image) {
            throw new Error('No image data provided');
        }

        // Clean base64 data
        const base64Data = body.image.split(',')[1] || body.image;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Process image with improved OCR
        console.log('Processing image...');
        const extractedText = await processImage(imageBuffer);
        
        console.log('Extracted Text:', extractedText); // Debug log
        
        // Clean text
        console.log('Cleaning text...');
        const cleanedText = cleanText(extractedText);

        // Parse recipe
        console.log('Parsing recipe...');
        const recipe = parseRecipe(cleanedText);

        // Generate ID
        const uniqueId = crypto.randomBytes(8).toString('hex');

        return buildSuccessResponse({
            success: true,
            message: "Recipe processed successfully",
            recipeUrl: `${process.env.URL}/recipe/${uniqueId}?data=${encodeURIComponent(JSON.stringify(recipe))}`,
            instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL",
            debug: {
                rawText: extractedText,
                cleanedText: cleanedText,
                ingredientCount: recipe.ingredients.length
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return buildErrorResponse(error);
    }
};