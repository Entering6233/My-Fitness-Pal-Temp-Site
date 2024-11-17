const Tesseract = require('tesseract.js');
const crypto = require('crypto');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = JSON.parse(event.body);
        if (!body.image) {
            throw new Error('No image data provided');
        }

        // Fix base64 image data handling
        const base64Data = body.image.split(',')[1] || body.image;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Single optimized OCR pass with better settings
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: m => console.log(m),
                tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/\\()[]{}!@#$%^&*-_+=<>?"|\'` ½⅓⅔¼¾⅛⅜⅝⅞',
                tessedit_pageseg_mode: '6',
                tessedit_ocr_engine_mode: '3',
                preserve_interword_spaces: '1',
                textord_heavy_nr: '1',
                tessedit_create_txt: '1',
                tessedit_enable_doc_dict: '1',
                tessedit_enable_bigram_correction: '1',
                tessjs_create_pdf: '0',
                tessjs_create_hocr: '0'
            }
        );

        let text = result.data.text;

        // Advanced text cleaning and normalization
        text = text
            // Basic cleanup
            .replace(/\s+/g, ' ')
            .replace(/(\d+)\.(\d+)/g, '$1.$2')
            .replace(/[^\x20-\x7E]/g, '')
            
            // Fix common OCR errors
            .replace(/[oO](?=\d)/g, '0')
            .replace(/[lI](?=\d)/g, '1')
            .replace(/[S5](?!\d)/g, 'S')
            .replace(/[Z2](?!\d)/g, 'Z')
            
            // Format measurements
            .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
            .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
            .replace(/\b(\d+)g\b/g, '$1 g')
            .replace(/\b(\d+)ml\b/g, '$1 ml')
            .replace(/\b(\d+)oz\b/g, '$1 oz')
            .replace(/\b(\d+)lb\b/g, '$1 lb')
            .replace(/\b(\d+)kg\b/g, '$1 kg')
            .replace(/\btbsp\b/gi, 'tablespoon')
            .replace(/\btsp\b/gi, 'teaspoon')
            
            // Convert fractions
            .replace(/½/g, '1/2')
            .replace(/⅓/g, '1/3')
            .replace(/⅔/g, '2/3')
            .replace(/¼/g, '1/4')
            .replace(/¾/g, '3/4')
            .replace(/⅛/g, '1/8')
            .replace(/⅜/g, '3/8')
            .replace(/⅝/g, '5/8')
            .replace(/⅞/g, '7/8')
            .trim();

        // Parse recipe
        const recipe = parseRecipeText(text);

        // Generate unique ID
        const uniqueId = crypto.randomBytes(8).toString('hex');
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Recipe processed successfully",
                recipeUrl: `${process.env.URL}/recipe/${uniqueId}?data=${encodeURIComponent(JSON.stringify(recipe))}`,
                instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL",
                debug: {
                    textLength: text.length,
                    ingredientCount: recipe.ingredients.length,
                    confidence: recipe.metadata?.confidence || 100
                }
            })
        };

    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Error processing image. Please try again with a clearer photo.',
                errorDetails: process.env.NODE_ENV === 'development' ? error.toString() : undefined
            })
        };
    }
};

// Keep your existing parseRecipeText and other helper functions