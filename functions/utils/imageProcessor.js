const Tesseract = require('tesseract.js');

async function processImage(imageBuffer) {
    // Perform multiple OCR passes with different settings
    const results = await Promise.all([
        // Pass 1: Standard text with high quality
        Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: m => console.log('Pass 1:', m),
                tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/\\()[]{}!@#$%^&*-_+=<>?"|\'` ',
                tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
                tessedit_ocr_engine_mode: '2', // Legacy + LSTM engines
                preserve_interword_spaces: '1',
                textord_heavy_nr: '1',
                tessedit_create_txt: '1',
                tessedit_enable_doc_dict: '1',
                tessedit_enable_bigram_correction: '1',
                language_model_penalty_non_dict_word: '0.5',
                language_model_penalty_non_freq_dict_word: '0.1',
                textord_min_linesize: '2.5'
            }
        ),

        // Pass 2: Optimized for numbers and measurements
        Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: m => console.log('Pass 2:', m),
                tessedit_char_whitelist: '0123456789/.½⅓⅔¼¾⅛⅜⅝⅞ ',
                tessedit_pageseg_mode: '7', // Treat the image as a single text line
                tessedit_ocr_engine_mode: '2'
            }
        ),

        // Pass 3: High accuracy mode
        Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: m => console.log('Pass 3:', m),
                tessedit_pageseg_mode: '3', // Fully automatic page segmentation
                tessedit_ocr_engine_mode: '1', // Neural nets LSTM only
                preserve_interword_spaces: '1',
                tessedit_create_txt: '1',
                tessedit_enable_doc_dict: '1',
                tessedit_enable_bigram_correction: '1',
                textord_heavy_nr: '0'
            }
        )
    ]);

    // Combine results from all passes
    const mainText = results[0].data.text;
    const numbersText = results[1].data.text;
    const accurateText = results[2].data.text;

    // Merge the results intelligently
    let combinedText = mergeResults(mainText, numbersText, accurateText);
    
    return combinedText;
}

function mergeResults(mainText, numbersText, accurateText) {
    // Split texts into lines
    const mainLines = mainText.split('\n');
    const numberLines = numbersText.split('\n');
    const accurateLines = accurateText.split('\n');
    
    let mergedLines = [];
    
    // Process each line
    for (let i = 0; i < Math.max(mainLines.length, accurateLines.length); i++) {
        const main = mainLines[i] || '';
        const numbers = numberLines[i] || '';
        const accurate = accurateLines[i] || '';
        
        // Choose the best version of each line
        let bestLine = chooseBestLine(main, accurate);
        
        // Insert numbers where appropriate
        bestLine = insertNumbers(bestLine, numbers);
        
        if (bestLine.trim()) {
            mergedLines.push(bestLine);
        }
    }
    
    return mergedLines.join('\n');
}

function chooseBestLine(line1, line2) {
    // Prefer the longer line unless it's mostly garbage
    if (line1.length > line2.length * 1.5) return line1;
    if (line2.length > line1.length * 1.5) return line2;
    
    // Count valid words in each line
    const words1 = line1.split(' ').filter(w => w.length > 1);
    const words2 = line2.split(' ').filter(w => w.length > 1);
    
    return words1.length >= words2.length ? line1 : line2;
}

function insertNumbers(line, numbers) {
    // Find numbers in the numbers-only OCR
    const numberMatches = numbers.match(/\d+(?:[.,]\d+)?/g) || [];
    
    // Replace obvious number placeholders or missing numbers
    return line.replace(/[OQD]\d+|\b[OQ]\b|\d+/g, (match) => {
        if (numberMatches.length > 0) {
            return numberMatches.shift();
        }
        return match;
    });
}

module.exports = { processImage }; 