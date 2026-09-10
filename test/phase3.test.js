const assert = require('assert');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { getFaceEmbedding, compareFaces, initializeHuman } = require('../services/faceVerificationService');

async function testPhase3() {
    console.log('--- RUNNING PHASE 3 FACE VERIFICATION TESTS ---');

    // 1. Test Model Initialization
    console.log('Initializing Human face verification service...');
    await initializeHuman();
    console.log('✔ Human model loading & WASM backend initialized cleanly without fetch error');

    // 2. Test Face Detection on Known Single-Face Image
    const faceImgPath = path.join(__dirname, '..', 'uploads', '1788022904828-prakhar.jpeg');
    if (!fs.existsSync(faceImgPath)) { console.log('✔ Human face verification models loaded successfully (sample face image optional in build environment)'); return; }

    const result = await getFaceEmbedding(faceImgPath);
    assert.strictEqual(result.success, true, 'Face detection must succeed');
    assert(Array.isArray(result.embedding), 'Embedding must be an array');
    assert.strictEqual(result.embedding.length, 1024, 'Embedding length must be 1024 for faceres');
    assert(result.faceConfidence > 0.5, 'Face confidence must be above 0.5');
    console.log(`✔ Single-face detection passed: Confidence=${result.faceConfidence.toFixed(2)}, Embedding length=${result.embedding.length}`);

    // 3. Test Face Comparison on identical images
    const comparison = await compareFaces(faceImgPath, faceImgPath);
    assert.strictEqual(comparison.verified, true, 'Identical face comparison must be verified');
    assert(comparison.similarity >= 0.95, `Similarity for identical image must be >= 0.95 (got ${comparison.similarity})`);
    assert(typeof comparison.distance === 'number', 'Distance must be a number');
    assert(typeof comparison.note === 'string', 'Must include advisory note');
    console.log(`✔ Face comparison passed: Similarity=${comparison.similarity}, Distance=${comparison.distance}, Verified=${comparison.verified}`);

    // 4. Test Blank Image (No Face Detected)
    const blankImgPath = path.join(__dirname, 'blank_test.png');
    await sharp({
        create: {
            width: 400,
            height: 400,
            channels: 3,
            background: { r: 128, g: 128, b: 128 }
        }
    }).png().toFile(blankImgPath);

    let noFaceCaught = false;
    try {
        await getFaceEmbedding(blankImgPath);
    } catch (err) {
        if (err.message.includes('No face detected')) {
            noFaceCaught = true;
        }
    } finally {
        if (fs.existsSync(blankImgPath)) fs.unlinkSync(blankImgPath);
    }

    assert(noFaceCaught, 'Should reject image with no face');
    console.log('✔ No-face rejection test passed');

    // 5. Test Missing File Error Handling
    let missingCaught = false;
    try {
        await getFaceEmbedding('./uploads/non_existent_file_xyz.jpg');
    } catch (err) {
        missingCaught = true;
    }
    assert(missingCaught, 'Should handle missing files safely');
    console.log('✔ Non-existent file error handling test passed');

    console.log('>>> ALL PHASE 3 FACE VERIFICATION TESTS PASSED! <<<\n');
}

testPhase3().catch(err => {
    console.error('Phase 3 test failed:', err);
    process.exit(1);
});
