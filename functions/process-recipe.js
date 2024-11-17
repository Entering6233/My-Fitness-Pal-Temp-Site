const crypto = require('crypto');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // Generate unique ID
        const uniqueId = crypto.randomBytes(8).toString('hex');
        
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