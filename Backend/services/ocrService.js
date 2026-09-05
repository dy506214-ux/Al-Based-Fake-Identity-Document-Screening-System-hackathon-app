const { createWorker, PSM } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

const extractText = async (imagePath) => {
    let worker;
    let processedPath = null;
    try {
        processedPath = imagePath.replace(/\.[^/.]+$/, '_processed_' + Date.now() + '.png');
        await sharp(imagePath)
            .resize({ width: 2000, withoutEnlargement: true })
            .grayscale()
            .normalize()
            .sharpen()
            .png()
            .toFile(processedPath);

        worker = await createWorker('eng');
        // PSM.AUTO (3) handles both block text and lower MRZ lines reliably
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
        const { data } = await worker.recognize(processedPath);
        console.log("OCR RAW TEXT LENGTH:", data.text ? data.text.length : 0);
        return data.text || '';
    } catch (error) {
        console.error('Error during OCR:', error.message);
        throw new Error('OCR processing failed: ' + error.message);
    } finally {
        if (worker) {
            await worker.terminate();
        }
        // Clean up temporary processed image immediately
        if (processedPath && fs.existsSync(processedPath)) {
            try {
                fs.unlinkSync(processedPath);
            } catch (cleanupErr) {
                // Ignore transient unlink error
            }
        }
    }
};


const extractDocumentText = (ocrText, documentType) => {
    const data = {};
    if(!ocrText) {
        return data;
    }
    //clean the text
    const text = ocrText.replace(/\r/g,'').trim();
    //current passport handling
    if(documentType && documentType.toLowerCase() === 'passport') {
        //name
        const nameMatch = text.match(/(?:name|full\s*name)\s*[:\-]?\s*([A-Za-z\s]+)/i);
        if(nameMatch) {
            data.name = nameMatch[1].trim();
        }
        //passport number
        const passportNumberMatch = text.match(/(?:passport\s*(?:no|number)?|document\s*no)\s*[:\-]?\s*([A-Z][0-9]{7})/i);
        if(passportNumberMatch) {
            data.passportNumber = passportNumberMatch[1].trim();
        }
        //nationality
        const nationalityMatch = text.match(/(?:nationality)\s*[:\-]?\s*([A-Za-z]{2,20})/i);
        if(nationalityMatch) {
            data.nationality = nationalityMatch[1].trim();
        }
        //date of birth
        const dobMatch = text.match(/(?:date\s*of\s*birth|dob|birth\s*date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if(dobMatch) {
            data.dateOfBirth = dobMatch[1].trim();
        }
        //expiry date
        const expiryDateMatch = text.match(/(?:expiry\s*of\s*expiry|expiry|expiration|expires)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if(expiryDateMatch) {
            data.expiryDate = expiryDateMatch[1].trim();
        }
        //gender
        const genderMatch = text.match(/(?:gender|sex)\s*[:\-]?\s*(male|female|m|f)/i);
        if(genderMatch) {
            data.gender = genderMatch[1].trim();
        }
    }
    return data;
    
};

module.exports = { extractText, extractDocumentText };


