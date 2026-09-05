// ==========================================
// MRZ CHECK DIGIT HELPER (ICAO 7-3-1 ALGORITHM)
// ==========================================

const calculateMrzCheckDigit = (inputStr) => {
    if (!inputStr) return null;
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < inputStr.length; i++) {
        const char = inputStr[i];
        let val = 0;
        if (char >= '0' && char <= '9') {
            val = parseInt(char, 10);
        } else if (char >= 'A' && char <= 'Z') {
            val = char.charCodeAt(0) - 55;
        } else if (char === '<') {
            val = 0;
        }
        sum += val * weights[i % 3];
    }
    return sum % 10;
};

// ==========================================
// PASSPORT DATA EXTRACTION
// ==========================================

const extractPassportData = (ocrText) => {
    const rawText = String(ocrText || '');
    const text = rawText.toUpperCase().trim();

    const data = {
        documentType: 'passport',
        name: null,
        passportNumber: null,
        nationality: null,
        dateOfBirth: null,
        dateOfExpiry: null,
        gender: null,
        mrzData: null
    };

    // ==========================================
    // 1. PASSPORT NUMBER EXTRACTION
    // Matches: 1 letter + 7 digits (India/UK), 2 letters + 7 digits, or labeled
    // ==========================================
    const labeledPassport = text.match(/(?:PASSPORT|DOCUMENT|PASS)\s*(?:NO|NUMBER)?\s*[:\-.]?\s*([A-Z0-9]{7,10})\b/i);
    if (labeledPassport && /^[A-Z]{1,2}[0-9]{6,9}$/.test(labeledPassport[1])) {
        data.passportNumber = labeledPassport[1];
    } else {
        const passportNumberPattern = /\b[A-Z]{1,2}[0-9]{7,8}\b/;
        const passportNumberMatch = text.match(passportNumberPattern);
        if (passportNumberMatch) {
            data.passportNumber = passportNumberMatch[0];
        }
    }

    // ==========================================
    // 2. GENDER EXTRACTION
    // ==========================================
    const labeledGender = text.match(/(?:SEX|GENDER)\s*[:\-./]?\s*(MALE|FEMALE|M|F)\b/i);
    if (labeledGender) {
        data.gender = labeledGender[1].toUpperCase();
    } else {
        const genderMatch = text.match(/\b(MALE|FEMALE)\b/);
        if (genderMatch) {
            data.gender = genderMatch[0];
        }
    }

    // ==========================================
    // 3. NATIONALITY EXTRACTION
    // ==========================================
    const labeledNationality = text.match(/(?:NATIONALITY|CITIZENSHIP)\s*[:\-./]?\s*([A-Z]{3,20})\b/i);
    if (labeledNationality) {
        data.nationality = labeledNationality[1].toUpperCase();
    } else {
        const natMatch = text.match(/\b(IND|INDIA|INDIAN|USA|GBR|FRA|DEU|CAN|AUS|EOL|EOLIAN)\b/);
        if (natMatch) {
            data.nationality = natMatch[0];
        }
    }

    // ==========================================
    // 4. DATE EXTRACTION
    // Supports: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MON YYYY
    // ==========================================
    const dateMatches = text.match(/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}\b/g);
    if (dateMatches && dateMatches.length >= 1) {
        data.dateOfBirth = dateMatches[0];
    }
    if (dateMatches && dateMatches.length >= 2) {
        data.dateOfExpiry = dateMatches[dateMatches.length - 1];
    }

    // Check textual months: e.g. 12 NOV 1992
    if (!data.dateOfBirth || !data.dateOfExpiry) {
        const textDateMatches = text.match(/\b\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}\b/g);
        if (textDateMatches && textDateMatches.length >= 1 && !data.dateOfBirth) {
            data.dateOfBirth = textDateMatches[0];
        }
        if (textDateMatches && textDateMatches.length >= 2 && !data.dateOfExpiry) {
            data.dateOfExpiry = textDateMatches[textDateMatches.length - 1];
        }
    }

    // Name from visual text
    const surnameMatch = text.match(/(?:SURNAME|NOM)\s*[:\-.]?\s*([A-Z\s]{2,30})/);
    const givenNameMatch = text.match(/(?:GIVEN\s*NAMES?|PRENOMS?)\s*[:\-.]?\s*([A-Z\s]{2,30})/);
    if (surnameMatch && givenNameMatch) {
        data.name = `${surnameMatch[1].trim()} ${givenNameMatch[1].trim()}`.replace(/\s+/g, ' ');
    }

    // ==========================================
    // 5. MRZ EXTRACTION & VALIDATION
    // ==========================================
    const lines = text.split(/\r?\n/).map(l => l.replace(/[\s\t]+/g, '').trim()).filter(Boolean);

    // Look for Line 1: starts with P<
    const line1 = lines.find(l => /^P<[A-Z0-9<]{30,}/.test(l));
    // Look for Line 2: 9 alphanumeric doc num followed by check digit, nationality, etc.
    const line2 = lines.find(l => /^[A-Z0-9<]{9}[0-9][A-Z<]{3}[0-9]{6}/.test(l));

    if (line1 || line2) {
        data.mrzData = {
            rawLine1: line1 || null,
            rawLine2: line2 || null,
            checksumValid: true
        };

        if (line1) {
            const countryCode = line1.substring(2, 5).replace(/</g, '');
            if (!data.nationality && countryCode) {
                data.nationality = countryCode;
            }

            const namePart = line1.substring(5).split('<<');
            const surname = namePart[0] ? namePart[0].replace(/<+/g, ' ').trim() : '';
            const givenName = namePart[1] ? namePart[1].replace(/<+/g, ' ').trim() : '';
            if (surname || givenName) {
                data.name = `${surname} ${givenName}`.trim();
            }
        }

        if (line2) {
            const mrzPassportNumber = line2.substring(0, 9).replace(/</g, '').trim();
            const passportCheckDigit = line2.substring(9, 10);
            const calculatedDocCheck = calculateMrzCheckDigit(line2.substring(0, 9));

            if (mrzPassportNumber) {
                data.passportNumber = mrzPassportNumber;
            }

            if (calculatedDocCheck !== null && passportCheckDigit && parseInt(passportCheckDigit, 10) !== calculatedDocCheck) {
                data.mrzData.checksumValid = false;
            }

            const mrzNationality = line2.substring(10, 13).replace(/</g, '').trim();
            if (mrzNationality && !data.nationality) {
                data.nationality = mrzNationality;
            }

            // DOB
            const mrzDob = line2.substring(13, 19);
            if (/^\d{6}$/.test(mrzDob)) {
                const year = Number(mrzDob.substring(0, 2));
                const month = mrzDob.substring(2, 4);
                const day = mrzDob.substring(4, 6);
                const fullYear = year >= 50 ? 1900 + year : 2000 + year;
                data.dateOfBirth = `${day}/${month}/${fullYear}`;
            }

            // Gender
            const mrzGender = line2.substring(20, 21);
            if (['M', 'F'].includes(mrzGender)) {
                data.gender = mrzGender;
            }

            // Expiry
            const mrzExpiry = line2.substring(21, 27);
            if (/^\d{6}$/.test(mrzExpiry)) {
                const year = Number(mrzExpiry.substring(0, 2));
                const month = mrzExpiry.substring(2, 4);
                const day = mrzExpiry.substring(4, 6);
                const fullYear = year >= 50 ? 1900 + year : 2000 + year;
                data.dateOfExpiry = `${day}/${month}/${fullYear}`;
            }
        }
    }

    return data;
};

// ==========================================
// GENERIC ID CARD DATA EXTRACTION
// ==========================================

const extractIdCardData = (ocrText) => {
    const text = String(ocrText || '').toUpperCase().trim();
    const data = {
        documentType: 'id_card',
        name: null,
        documentNumber: null,
        dateOfBirth: null,
        gender: null
    };

    const idNumberMatch = text.match(/\b([A-Z0-9]{8,14})\b/);
    if (idNumberMatch) {
        data.documentNumber = idNumberMatch[1];
    }

    const genderMatch = text.match(/\b(MALE|FEMALE|M|F)\b/);
    if (genderMatch) {
        data.gender = genderMatch[0];
    }

    const dateMatches = text.match(/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}\b/g);
    if (dateMatches && dateMatches.length > 0) {
        data.dateOfBirth = dateMatches[0];
    }

    return data;
};

// ==========================================
// MAIN EXTRACTION ENTRYPOINT
// ==========================================

const extractDocumentData = (ocrText, documentType) => {
    if (!ocrText || !documentType) {
        return {};
    }

    const type = String(documentType).toLowerCase().trim();
    switch (type) {
        case 'passport':
            return extractPassportData(ocrText);
        case 'id_card':
        case 'national_id':
        case 'identity_card':
            return extractIdCardData(ocrText);
        default:
            return extractPassportData(ocrText);
    }
};

module.exports = {
    extractDocumentData,
    calculateMrzCheckDigit
};