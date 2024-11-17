exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // Simple test response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: "Function is working",
                recipeUrl: `${process.env.URL}/recipe/test123`,
                instructions: "Test instructions"
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