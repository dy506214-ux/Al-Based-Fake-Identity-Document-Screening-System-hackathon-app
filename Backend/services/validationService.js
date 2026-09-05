// ==========================================
// DATE PARSER
// Supports DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MON YYYY
// ==========================================

const parseDateString = (dateString) => {
    if (!dateString) return null;

    const months = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const value = String(dateString).toUpperCase().trim().replace(/\s+/g, ' ');

    let day, month, year;

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    let match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (match) {
        day = Number(match[1]);
        month = Number(match[2]) - 1;
        year = Number(match[3]);
    }

    // DD MON YYYY
    if (!match) {
        match = value.match(/^(\d{1,2})[\s/-](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\s/-](\d{4})$/);
        if (match) {
            day = Number(match[1]);
            month = months[match[2]];
            year = Number(match[3]);
        }
    }

    if (day === undefined || month === undefined || year === undefined) {
        return null;
    }

    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
};

const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// ==========================================
// DOCUMENT VALIDATION ENGINE
// ==========================================

const validateDocument = (document, extractedData) => {
    const errors = [];
    const warnings = [];
    const checks = [];

    const data = extractedData || {};
    const text = String(document?.ocrText || '').toUpperCase().trim();
    const documentType = String(document?.documentType || 'passport').toLowerCase().trim();

    // 1. OCR Text Quality Check
    if (!text) {
        errors.push('OCR text could not be extracted from document');
        checks.push({ name: 'OCR Readability', passed: false, message: 'No readable text extracted' });
    } else if (text.length < 25) {
        warnings.push('Extracted OCR text is unusually brief');
        checks.push({ name: 'OCR Readability', passed: true, message: 'Minimal text extracted' });
    } else {
        checks.push({ name: 'OCR Readability', passed: true, message: 'Sufficient readable text found' });
    }

    // 2. Document Type Check
    if (!documentType) {
        errors.push('Document type is missing');
        checks.push({ name: 'Document Type', passed: false, message: 'Document type not specified' });
    } else {
        checks.push({ name: 'Document Type', passed: true, message: `Type recognized: ${documentType}` });
    }

    // 3. Passport Validation Checks
    if (documentType === 'passport') {
        // Document Number
        if (!data.passportNumber) {
            errors.push('Passport number could not be extracted');
            checks.push({ name: 'Document Number', passed: false, message: 'Passport number missing' });
        } else {
            const cleanNumber = String(data.passportNumber).replace(/[\s<]/g, '').toUpperCase();
            if (/^[A-Z0-9]{7,10}$/.test(cleanNumber)) {
                checks.push({ name: 'Document Number', passed: true, message: `Valid passport number: ${cleanNumber}` });
            } else {
                errors.push('Passport number format is non-standard');
                checks.push({ name: 'Document Number', passed: false, message: 'Format error in passport number' });
            }
        }

        // Name
        if (!data.name) {
            warnings.push('Full name could not be extracted from document');
            checks.push({ name: 'Full Name', passed: false, message: 'Name not detected' });
        } else {
            checks.push({ name: 'Full Name', passed: true, message: `Holder name: ${data.name}` });
        }

        // Nationality
        if (!data.nationality) {
            warnings.push('Nationality could not be extracted');
            checks.push({ name: 'Nationality', passed: false, message: 'Nationality missing' });
        } else {
            checks.push({ name: 'Nationality', passed: true, message: `Nationality: ${data.nationality}` });
        }

        // Dates Parsing
        const dob = parseDateString(data.dateOfBirth);
        const expiry = parseDateString(data.dateOfExpiry);
        const today = getToday();

        if (!data.dateOfBirth) {
            warnings.push('Date of birth could not be extracted');
            checks.push({ name: 'Date of Birth', passed: false, message: 'DOB missing' });
        } else if (!dob) {
            errors.push(`Invalid date of birth format: ${data.dateOfBirth}`);
            checks.push({ name: 'Date of Birth', passed: false, message: 'Invalid DOB value' });
        } else if (dob > today) {
            errors.push('Date of birth cannot be in the future');
            checks.push({ name: 'Date of Birth', passed: false, message: 'DOB is in future' });
        } else {
            checks.push({ name: 'Date of Birth', passed: true, message: `DOB verified: ${data.dateOfBirth}` });
        }

        // Expiry Date Validation
        if (!data.dateOfExpiry) {
            warnings.push('Date of expiry could not be extracted');
            checks.push({ name: 'Expiry Date', passed: false, message: 'Expiry date missing' });
        } else if (!expiry) {
            errors.push(`Invalid expiry date format: ${data.dateOfExpiry}`);
            checks.push({ name: 'Expiry Date', passed: false, message: 'Invalid expiry value' });
        } else if (expiry < today) {
            errors.push('Passport has expired');
            checks.push({ name: 'Expiry Date', passed: false, message: `Document expired on ${data.dateOfExpiry}` });
        } else {
            // Check if nearing expiry (within 60 days)
            const sixtyDaysAhead = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
            if (expiry < sixtyDaysAhead) {
                warnings.push('Passport is nearing expiration (within 60 days)');
            }
            checks.push({ name: 'Expiry Date', passed: true, message: `Valid until ${data.dateOfExpiry}` });
        }

        // Date consistency
        if (dob && expiry && expiry <= dob) {
            errors.push('Expiry date must be after date of birth');
            checks.push({ name: 'Date Consistency', passed: false, message: 'Expiry precedes DOB' });
        }

        // MRZ Checksum check
        if (data.mrzData) {
            if (data.mrzData.checksumValid === false) {
                warnings.push('MRZ check digit discrepancy detected (requires review)');
                checks.push({ name: 'MRZ Checksum', passed: false, message: 'MRZ check digit discrepancy' });
            } else {
                checks.push({ name: 'MRZ Checksum', passed: true, message: 'MRZ check digits verified' });
            }
        }

    } else {
        // Generic ID card validation
        if (!data.name && !data.documentNumber) {
            warnings.push('Core identity fields could not be extracted from ID card');
            checks.push({ name: 'Core Fields', passed: false, message: 'Missing document number and name' });
        } else {
            checks.push({ name: 'Core Fields', passed: true, message: 'Document identifier present' });
        }
    }

    // Determine final validation status
    let status = 'VALIDATED';
    let valid = true;

    if (errors.length > 0) {
        status = 'REJECTED';
        valid = false;
    } else if (warnings.length > 0) {
        status = 'NEEDS_REVIEW';
        valid = true;
    }

    return {
        valid,
        status,
        errors,
        warnings,
        checks
    };
};

module.exports = {
    validateDocument,
    parseDateString
};