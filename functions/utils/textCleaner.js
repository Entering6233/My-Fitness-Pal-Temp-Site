function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/(\d+)\.(\d+)/g, '$1.$2')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/[oO](?=\d)/g, '0')
        .replace(/[lI](?=\d)/g, '1')
        .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
        .replace(/\b(\d+)g\b/g, '$1 g')
        .replace(/\b(\d+)ml\b/g, '$1 ml')
        .replace(/\b(\d+)oz\b/g, '$1 oz')
        .replace(/\b(\d+)lb\b/g, '$1 lb')
        .trim();
}

module.exports = { cleanText }; 