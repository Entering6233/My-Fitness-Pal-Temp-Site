const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const shortid = require('shortid');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Add template engine
app.set('view engine', 'ejs');

// Store temporary recipes (in production, use a proper database)
const tempRecipes = new Map();

app.post('/process-recipe', upload.single('recipe-image'), async (req, res) => {
    try {
        // Extract text from image using OCR
        const { data: { text } } = await Tesseract.recognize(
            req.file.path,
            'eng'
        );

        // Parse recipe
        const recipe = await parseRecipeText(text);
        
        // Generate unique temporary ID
        const tempId = shortid.generate();
        
        // Store recipe temporarily (24hr expiry)
        tempRecipes.set(tempId, recipe);
        setTimeout(() => tempRecipes.delete(tempId), 24 * 60 * 60 * 1000);

        // Generate temporary URL
        const recipeUrl = `${req.protocol}://${req.get('host')}/recipe/${tempId}`;

        res.json({
            success: true,
            message: "Recipe processed successfully",
            recipeUrl,
            instructions: "Open MyFitnessPal > Recipes > Add Recipe > Copy from the Web > Paste this URL"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve recipe page in MyFitnessPal-compatible format
app.get('/recipe/:id', (req, res) => {
    const recipe = tempRecipes.get(req.params.id);
    if (!recipe) {
        return res.status(404).send('Recipe not found or expired');
    }

    res.render('recipe', { recipe });
});

async function parseRecipeText(text) {
    // Basic recipe parsing
    const lines = text.split('\n');
    const ingredients = [];
    let recipeName = 'Untitled Recipe';
    let servings = 1;

    // Try to find recipe name (usually first line)
    if (lines.length > 0) {
        recipeName = lines[0].trim();
    }

    // Look for servings information
    const servingsMatch = text.match(/serves\s+(\d+)/i);
    if (servingsMatch) {
        servings = parseInt(servingsMatch[1]);
    }

    // Parse ingredients
    for (const line of lines) {
        const match = line.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)/);
        if (match) {
            ingredients.push({
                amount: match[1],
                unit: match[2],
                name: match[3].trim()
            });
        }
    }

    return {
        name: recipeName,
        servings,
        ingredients,
        // Add placeholder nutrition data
        nutrition: {
            servingSize: '1 serving',
            calories: 300,
            protein: 20,
            carbs: 30,
            fat: 10
        }
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});