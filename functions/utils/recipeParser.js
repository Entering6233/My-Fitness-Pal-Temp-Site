function parseRecipe(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    return {
        name: lines[0] || 'Untitled Recipe',
        ingredients: parseIngredients(lines.slice(1)),
        originalText: text
    };
}

function parseIngredients(lines) {
    const ingredients = [];
    const pattern = /(\d+(?:\/\d+)?(?:\.\d+)?)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(.+)/;

    for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
            ingredients.push({
                amount: match[1],
                unit: match[2],
                name: match[3].trim()
            });
        }
    }

    return ingredients;
}

module.exports = { parseRecipe }; 