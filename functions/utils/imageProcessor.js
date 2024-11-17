const Tesseract = require('tesseract.js');
const OCRAD = require('ocrad.js');

async function processImage(imageBuffer) {
    try {
        // Run multiple OCR passes in parallel
        const results = await Promise.all([
            // Tesseract Pass 1: Standard text
            Tesseract.recognize(
                imageBuffer,
                'eng',
                {
                    logger: m => console.log('Tesseract 1:', m),
                    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/\\()[]{}!@#$%^&*-_+=<>?"|\'` ',
                    tessedit_pageseg_mode: '1',
                    tessedit_ocr_engine_mode: '2',
                    preserve_interword_spaces: '1'
                }
            ),

            // Tesseract Pass 2: Numbers focus
            Tesseract.recognize(
                imageBuffer,
                'eng',
                {
                    logger: m => console.log('Tesseract 2:', m),
                    tessedit_char_whitelist: '0123456789/.½⅓⅔¼¾⅛⅜⅝⅞ ',
                    tessedit_pageseg_mode: '7'
                }
            ),

            // OCRAD pass
            new Promise((resolve) => {
                const ocradResult = OCRAD(imageBuffer);
                resolve(ocradResult);
            })
        ]);

        // Combine results
        const combinedText = combineResults({
            tesseract: results[0].data.text,
            tesseractNumbers: results[1].data.text,
            ocrad: results[2]
        });

        return combinedText;
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
}

function combineResults({ tesseract, tesseractNumbers, ocrad }) {
    // Split into lines
    const lines = {
        tesseract: tesseract.split('\n'),
        tesseractNumbers: tesseractNumbers.split('\n'),
        ocrad: ocrad.split('\n')
    };

    let combinedLines = [];
    const maxLines = Math.max(
        lines.tesseract.length,
        lines.ocrad.length
    );

    for (let i = 0; i < maxLines; i++) {
        const tesseractLine = lines.tesseract[i] || '';
        const ocradLine = lines.ocrad[i] || '';
        const numberLine = lines.tesseractNumbers[i] || '';

        // Choose best line
        let bestLine = chooseBestLine(tesseractLine, ocradLine);
        
        // Enhance numbers
        bestLine = enhanceNumbers(bestLine, numberLine);
        
        if (bestLine.trim()) {
            combinedLines.push(bestLine);
        }
    }

    return combinedLines.join('\n');
}

function chooseBestLine(line1, line2) {
    const score1 = calculateLineScore(line1);
    const score2 = calculateLineScore(line2);
    
    // If scores are close, combine the lines
    if (Math.abs(score1 - score2) < 5) {
        return combineSimilarLines(line1, line2);
    }
    
    return score1 >= score2 ? line1 : line2;
}

function calculateLineScore(line) {
    if (!line) return 0;
    
    let score = 0;
    
    // Length score
    score += line.length * 0.1;
    
    // Word count score
    score += line.split(/\s+/).length * 2;
    
    // Recipe-specific word score
    const recipeWords = [
        'ingredients', 'cup', 'tablespoon', 'teaspoon', 
        'gram', 'ounce', 'pound', 'recipe', 'serving'
    ];
    recipeWords.forEach(word => {
        if (line.toLowerCase().includes(word)) score += 5;
    });
    
    // Number score
    const numbers = line.match(/\d+/g) || [];
    score += numbers.length * 3;
    
    // Measurement score
    const measurements = [
        'g', 'kg', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 
        'ml', 'l', 'pound', 'ounce', 'gram'
    ];
    measurements.forEach(measure => {
        if (line.toLowerCase().includes(measure)) score += 4;
    });
    
    // Penalize garbage
    const garbage = line.match(/[^a-zA-Z0-9.,\s/\\()[\]{}\-_+=<>?"|'`]/g) || [];
    score -= garbage.length * 3;
    
    return score;
}

function combineSimilarLines(line1, line2) {
    const words1 = line1.split(/\s+/);
    const words2 = line2.split(/\s+/);
    let combined = [];
    
    // Compare each word and choose the better one
    const maxWords = Math.max(words1.length, words2.length);
    for (let i = 0; i < maxWords; i++) {
        const word1 = words1[i] || '';
        const word2 = words2[i] || '';
        
        if (!word1) combined.push(word2);
        else if (!word2) combined.push(word1);
        else {
            // Choose the word that looks more like a valid word
            const score1 = calculateWordScore(word1);
            const score2 = calculateWordScore(word2);
            combined.push(score1 >= score2 ? word1 : word2);
        }
    }
    
    return combined.join(' ');
}

function calculateWordScore(word) {
    let score = 0;
    
    // Prefer words with a good mix of characters
    score += (word.match(/[a-zA-Z]/g) || []).length * 1;
    score += (word.match(/\d/g) || []).length * 1.5;
    
    // Penalize unusual characters
    score -= (word.match(/[^a-zA-Z0-9.,]/g) || []).length * 2;
    
    return score;
}

function enhanceNumbers(line, numberLine) {
    // Extract numbers from number-specific OCR
    const numbers = numberLine.match(/\d+(?:[.,]\d+)?/g) || [];
    let numberIndex = 0;

    // Replace and enhance numbers
    return line
        .replace(/[OQD]\d+|\b[OQ]\b|\d+/g, (match) => {
            if (numbers[numberIndex]) {
                const num = numbers[numberIndex++];
                return num;
            }
            return match;
        })
        .replace(/1\/2/g, '½')
        .replace(/1\/3/g, '⅓')
        .replace(/2\/3/g, '⅔')
        .replace(/1\/4/g, '¼')
        .replace(/3\/4/g, '¾')
        .replace(/1\/8/g, '⅛')
        .replace(/3\/8/g, '⅜')
        .replace(/5\/8/g, '⅝')
        .replace(/7\/8/g, '⅞');
}

module.exports = { processImage }; 