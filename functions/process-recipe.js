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

        // Multiple OCR passes with different optimizations
        const results = await Promise.all([
            // Pass 1: Optimized for general text
            Tesseract.recognize(
                Buffer.from(body.image, 'base64'),
                'eng',
                {
                    logger: m => console.log(m),
                    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/\\()[]{}!@#$%^&*-_+=<>?"|\'` ',
                    tessedit_pageseg_mode: '6',
                    tessedit_ocr_engine_mode: '3',
                    preserve_interword_spaces: '1',
                    textord_heavy_nr: '1',
                    tessedit_create_txt: '1',
                    tessedit_enable_doc_dict: '1',
                    tessedit_enable_bigram_correction: '1'
                }
            ),
            // Pass 2: Optimized for numbers and measurements
            Tesseract.recognize(
                Buffer.from(body.image, 'base64'),
                'eng',
                {
                    tessedit_char_whitelist: '0123456789/.½⅓⅔¼¾⅛⅜⅝⅞ ',
                    tessedit_pageseg_mode: '7',
                    tessedit_ocr_engine_mode: '2'
                }
            ),
            // Pass 3: Optimized for ingredient names
            Tesseract.recognize(
                Buffer.from(body.image, 'base64'),
                'eng',
                {
                    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ',
                    tessedit_pageseg_mode: '3',
                    tessedit_ocr_engine_mode: '3'
                }
            )
        ]);

        // Combine results from different passes
        let text = results[0].data.text;
        const numbersText = results[1].data.text;
        const ingredientText = results[2].data.text;

        // Advanced text cleaning and normalization
        text = text
            // Basic cleanup
            .replace(/\s+/g, ' ')
            .replace(/(\d+)\.(\d+)/g, '$1.$2')
            .replace(/[^\x20-\x7E]/g, '')
            
            // Fix common OCR errors
            .replace(/[oO](?=\d)/g, '0')  // Replace o/O with 0 when before numbers
            .replace(/[lI](?=\d)/g, '1')  // Replace l/I with 1 when before numbers
            .replace(/[S5](?!\d)/g, 'S')  // Fix S/5 confusion
            .replace(/[Z2](?!\d)/g, 'Z')  // Fix Z/2 confusion
            
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
            
            // Fix common unit abbreviations
            .replace(/(\d+)\s*c\b/gi, '$1 cup')
            .replace(/(\d+)\s*T\b/gi, '$1 tablespoon')
            .replace(/(\d+)\s*t\b/gi, '$1 teaspoon')
            .replace(/(\d+)\s*oz\b/gi, '$1 ounce')
            .replace(/(\d+)\s*lb\b/gi, '$1 pound')
            .trim();

        // Combine information from all passes
        const combinedText = {
            main: text,
            numbers: numbersText,
            ingredients: ingredientText
        };

        console.log('OCR Results:', combinedText); // Debug log

        // Parse recipe with combined information
        const recipe = parseRecipeText(combinedText);

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
                    rawText: text,
                    numbersText: numbersText,
                    ingredientText: ingredientText,
                    parsedIngredients: recipe.ingredients
                }
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