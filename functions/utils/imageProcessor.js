const Tesseract = require('tesseract.js');

async function processImage(imageBuffer) {
    const result = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
            logger: m => console.log('Tesseract progress:', m),
            tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/\\()[]{}!@#$%^&*-_+=<>?"|\'` ',
            tessedit_pageseg_mode: '6',
            tessedit_ocr_engine_mode: '3'
        }
    );

    return result.data.text;
}

module.exports = { processImage }; 