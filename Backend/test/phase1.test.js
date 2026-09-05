const assert = require('assert');
const Document = require('../model/document');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function testPhase1() {
    console.log('--- RUNNING PHASE 1 STABILIZATION TESTS ---');

    // 1. Verify Document Model Schema & Enums
    const riskEnum = Document.schema.path('riskLevel').enumValues;
    assert(riskEnum.includes('CRITICAL'), 'Document schema should include CRITICAL in riskLevel');
    assert(Document.schema.path('extractedData'), 'Document schema should include extractedData');
    assert(Document.schema.path('validationDetails'), 'Document schema should include validationDetails');
    assert(Document.schema.path('fakeDetectionDetails'), 'Document schema should include fakeDetectionDetails');
    assert(Document.schema.path('faceVerification'), 'Document schema should include faceVerification');
    console.log('✔ Document schema tests passed: riskLevel has CRITICAL, all pipeline fields present');

    // 2. Verify Auth Middleware
    assert(typeof protect === 'function', 'protect should be a function');
    assert(typeof authorizeRoles === 'function', 'authorizeRoles should be a function');

    const adminOnly = authorizeRoles('ADMIN');
    let rejected = false;
    const mockRes = {
        status: (code) => {
            if (code === 403) rejected = true;
            return { json: () => {} };
        }
    };
    adminOnly({ user: { role: 'OFFICER' } }, mockRes, () => {});
    assert(rejected, 'authorizeRoles should reject OFFICER when ADMIN is required');

    let accepted = false;
    adminOnly({ user: { role: 'ADMIN' } }, mockRes, () => { accepted = true; });
    assert(accepted, 'authorizeRoles should allow ADMIN when ADMIN is required');
    console.log('✔ Auth middleware tests passed: protect and authorizeRoles work properly');

    // 3. Verify ApiResponse utilities
    let responseStatus = null;
    let responseData = null;
    const testRes = {
        status: (code) => {
            responseStatus = code;
            return {
                json: (payload) => { responseData = payload; }
            };
        }
    };

    successResponse(testRes, 200, 'All good', { test: 123 });
    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.data.test, 123);

    errorResponse(testRes, 400, 'Bad request', ['Err 1']);
    assert.strictEqual(responseStatus, 400);
    assert.strictEqual(responseData.success, false);
    assert.strictEqual(responseData.errors[0], 'Err 1');
    console.log('✔ ApiResponse utility tests passed');

    console.log('>>> ALL PHASE 1 TESTS PASSED SUCCESSFULLY! <<<\n');
}

testPhase1().catch(err => {
    console.error('Phase 1 test failed:', err);
    process.exit(1);
});
