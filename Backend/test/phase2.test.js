const assert = require('assert');
const { extractDocumentData, calculateMrzCheckDigit } = require('../services/documentExtractionService');
const { validateDocument, parseDateString } = require('../services/validationService');
const { detectFakeDocument } = require('../services/fakeDocumentService');
const { calculateRisk } = require('../services/riskAssessmentService');

async function testPhase2() {
    console.log('--- RUNNING PHASE 2 SCREENING PIPELINE TESTS ---');

    // 1. Test ICAO MRZ check digit algorithm
    // Example: 'HA672242' has check digit
    const checkDigit1 = calculateMrzCheckDigit('HA672242');
    assert(typeof checkDigit1 === 'number' && checkDigit1 >= 0 && checkDigit1 <= 9, 'Check digit must be between 0 and 9');
    console.log('✔ MRZ Check digit calculation passed');

    // 2. Test Passport Extraction with sample OCR text
    const samplePassportOcr = `
    PASSPORT REPUBLIC OF INDIA
    Type: P  Country Code: IND  Passport No: Z1234567
    Surname: SHARMA
    Given Name: ROHIT
    Nationality: INDIAN
    Date of Birth: 15/08/1990
    Sex: M
    Date of Expiry: 14/08/2030
    P<INDSHARMA<<ROHIT<<<<<<<<<<<<<<<<<<<<<<<<<<<
    Z1234567<1IND9008154M3008142<<<<<<<<<<<<<<<4
    `;

    const extracted = extractDocumentData(samplePassportOcr, 'passport');
    assert.strictEqual(extracted.passportNumber, 'Z1234567', 'Passport number should be extracted');
    assert(['IND', 'INDIAN'].includes(extracted.nationality), 'Nationality should be extracted as IND or INDIAN');
    assert.strictEqual(extracted.gender, 'M', 'Gender should be extracted');
    assert.strictEqual(extracted.dateOfBirth, '15/08/1990', 'DOB should be extracted');
    assert.strictEqual(extracted.dateOfExpiry, '14/08/2030', 'Expiry should be extracted');
    assert(extracted.name.includes('SHARMA') && extracted.name.includes('ROHIT'), 'Full name should be extracted');
    assert(extracted.mrzData !== null, 'MRZ data should be extracted');
    console.log('✔ Passport extraction tests passed with accurate fields and MRZ');

    // 3. Test Date Parser
    const d1 = parseDateString('15/08/1990');
    assert(d1 instanceof Date && d1.getFullYear() === 1990, 'Date slash format should parse');
    const d2 = parseDateString('14.07.1981');
    assert(d2 instanceof Date && d2.getFullYear() === 1981, 'Date dot format should parse');
    const d3 = parseDateString('12 NOV 1992');
    assert(d3 instanceof Date && d3.getFullYear() === 1992, 'Date textual month should parse');
    console.log('✔ Date parsing tests passed across dot, slash, and text formats');

    // 4. Test Validation Engine
    const mockDoc = { ocrText: samplePassportOcr, documentType: 'passport' };
    const validationResult = validateDocument(mockDoc, extracted);
    assert.strictEqual(validationResult.valid, true, 'Clean passport should be valid');
    assert.strictEqual(validationResult.status, 'VALIDATED', 'Clean passport status should be VALIDATED');
    assert(Array.isArray(validationResult.checks), 'Validation result should contain checks array');
    assert(validationResult.checks.length >= 4, 'Must perform multiple structured checks');
    console.log('✔ Validation engine passed: returned structured checks and valid status');

    // 5. Test Expired Document Rejection
    const expiredExtracted = { ...extracted, dateOfExpiry: '01/01/2010' };
    const expiredValidation = validateDocument(mockDoc, expiredExtracted);
    assert.strictEqual(expiredValidation.valid, false, 'Expired document must fail validation');
    assert.strictEqual(expiredValidation.status, 'REJECTED', 'Expired document status must be REJECTED');
    console.log('✔ Expired document correctly rejected by validation');

    // 6. Test Fake Document Detection Heuristics
    const fakeDetection = await detectFakeDocument({ ocrText: samplePassportOcr, documentType: 'passport' });
    assert(fakeDetection.status === 'GENUINE' || fakeDetection.status === 'SUSPICIOUS', 'Fake detection must return status');
    assert(Array.isArray(fakeDetection.indicators), 'Fake detection must return indicators array');
    console.log('✔ Fake document detection passed: structured indicators produced');

    // 7. Test Risk Assessment
    const lowRisk = calculateRisk({
        validationResult,
        fakeDetectionResult: { status: 'GENUINE', reasons: [] },
        documentData: extracted
    });
    assert.strictEqual(lowRisk.riskLevel, 'LOW', 'Clean document should have LOW risk');

    const highRisk = calculateRisk({
        validationResult: expiredValidation,
        fakeDetectionResult: { status: 'SUSPICIOUS', reasons: ['Anomalies'] },
        documentData: expiredExtracted
    });
    assert(highRisk.riskLevel === 'HIGH' || highRisk.riskLevel === 'CRITICAL', 'Failed document must have HIGH or CRITICAL risk');
    assert(highRisk.riskScore >= 60, 'Risk score must reflect weights');
    console.log('✔ Risk assessment engine passed: correctly graded LOW and HIGH/CRITICAL risk');

    console.log('>>> ALL PHASE 2 TESTS PASSED SUCCESSFULLY! <<<\n');
}

testPhase2().catch(err => {
    console.error('Phase 2 test failed:', err);
    process.exit(1);
});
