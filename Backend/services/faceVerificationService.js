const fs = require('fs');
const path = require('path');
const canvas = require('canvas');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs-core');
require('@tensorflow/tfjs-converter');
const wasm = require('@tensorflow/tfjs-backend-wasm');
const Human = require('../node_modules/@vladmandic/human/dist/human.node-wasm.js');

// ==========================================
// 1. FILE PROTOCOL PATCH FOR NODE 18+ FETCH
// Resolves undici "fetch failed: not implemented... yet..." on file:// URLs
// ==========================================
if (typeof globalThis.fetch === 'function') {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        if (typeof url === 'string' && url.startsWith('file://')) {
            try {
                const parsedUrl = new URL(url);
                const filePath = decodeURIComponent(parsedUrl.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
                const fileData = fs.readFileSync(filePath);
                return new Response(fileData, {
                    status: 200,
                    headers: { 'Content-Type': filePath.endsWith('.json') ? 'application/json' : 'application/octet-stream' }
                });
            } catch (err) {
                console.error(`[FETCH PATCH] Error loading local file: ${url}`, err.message);
                throw err;
            }
        }
        return originalFetch(url, options);
    };
}

// Patch global Canvas for Human library
globalThis.Canvas = canvas.Canvas;
globalThis.ImageData = canvas.ImageData;

// ==========================================
// 2. CONFIGURE TENSORFLOW WASM PATHS
// ==========================================
const wasmDir = path.join(
    process.cwd(),
    'node_modules',
    '@tensorflow',
    'tfjs-backend-wasm',
    'dist'
);

wasm.setWasmPaths({
    'tfjs-backend-wasm.wasm': path.join(wasmDir, 'tfjs-backend-wasm.wasm'),
    'tfjs-backend-wasm-simd.wasm': path.join(wasmDir, 'tfjs-backend-wasm-simd.wasm'),
    'tfjs-backend-wasm-threaded-simd.wasm': path.join(wasmDir, 'tfjs-backend-wasm-threaded-simd.wasm')
});

const modelDir = path.join(
    process.cwd(),
    'node_modules',
    '@vladmandic',
    'human',
    'models'
);

const humanConfig = {
    backend: 'wasm',
    wasmPaths: wasmDir + path.sep,
    modelBasePath: `file://${modelDir.replace(/\\/g, '/')}/`,
    face: {
        enabled: true,
        detector: {
            rotation: false,
            return: true,
            maxDetected: 10,
            minConfidence: 0.2
        },
        mesh: {
            enabled: true
        },
        description: {
            enabled: true
        },
        iris: {
            enabled: false
        },
        emotion: {
            enabled: false
        }
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false }
};

// ==========================================
// 3. HUMAN SINGLETON INSTANCE
// ==========================================
const human = new Human.Human(humanConfig);
human.env.Canvas = canvas.Canvas;
human.env.Image = canvas.Image;
human.env.ImageData = canvas.ImageData;

let isInitialized = false;
let initPromise = null;

const initializeHuman = async () => {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log('[FACE VERIFICATION] Initializing TensorFlow WASM backend...');
        await tf.setBackend('wasm');
        await tf.ready();
        console.log('[FACE VERIFICATION] TensorFlow backend ready:', tf.getBackend());

        console.log('[FACE VERIFICATION] Loading Human models...');
        await human.init();
        await human.load();
        await human.warmup();

        isInitialized = true;
        console.log('[FACE VERIFICATION] Human initialized successfully! Models loaded:', human.models.loaded());
    })();

    return initPromise;
};

// ==========================================
// 4. IMAGE NORMALIZATION & EMBEDDING
// ==========================================

/**
 * Load and normalize any image into Canvas ImageData
 */
const loadImageData = async (imageInput) => {
    let pngBuffer;
    if (Buffer.isBuffer(imageInput)) {
        pngBuffer = await sharp(imageInput).png().toBuffer();
    } else if (typeof imageInput === 'string') {
        if (!fs.existsSync(imageInput)) {
            throw new Error(`Image file not found: ${imageInput}`);
        }
        pngBuffer = await sharp(imageInput).png().toBuffer();
    } else {
        throw new Error('Invalid image input provided to face verification');
    }

    const img = await canvas.loadImage(pngBuffer);
    const cvs = new canvas.Canvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, cvs.width, cvs.height);
};

/**
 * Detect face and extract 1024-dimension embedding
 */
const getFaceEmbedding = async (imageInput) => {
    await initializeHuman();

    const imageData = await loadImageData(imageInput);
    const result = await human.detect(imageData);

    if (!result.face || result.face.length === 0) {
        throw new Error('No face detected in image');
    }

    if (result.face.length > 1) {
        throw new Error(`Multiple faces detected (${result.face.length}). Please provide an image containing exactly one person.`);
    }

    const face = result.face[0];
    if (!face.embedding || face.embedding.length === 0) {
        throw new Error('Face detected but descriptor/embedding could not be computed');
    }

    return {
        success: true,
        embedding: face.embedding,
        faceConfidence: face.score || 0,
        box: face.box || null
    };
};

/**
 * Compare two face images and return verification metrics
 */
const compareFaces = async (imageInput1, imageInput2, thresholdOverride = null) => {
    const face1 = await getFaceEmbedding(imageInput1);
    const face2 = await getFaceEmbedding(imageInput2);

    // Human similarity computation
    const similarityResult = human.match.similarity(face1.embedding, face2.embedding, { order: 2 });
    const similarity = typeof similarityResult === 'number' ? similarityResult : (similarityResult.similarity || 0);

    // Distance calculation
    let distance = 0;
    for (let i = 0; i < face1.embedding.length; i++) {
        const diff = face1.embedding[i] - face2.embedding[i];
        distance += diff * diff;
    }
    distance = Math.sqrt(distance);

    // Verification threshold: default 0.60 (configurable)
    const threshold = thresholdOverride !== null 
        ? thresholdOverride 
        : parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.60');

    const verified = similarity >= threshold;

    return {
        verified,
        similarity: parseFloat(similarity.toFixed(4)),
        distance: parseFloat(distance.toFixed(4)),
        threshold,
        face1Confidence: parseFloat(face1.faceConfidence.toFixed(4)),
        face2Confidence: parseFloat(face2.faceConfidence.toFixed(4)),
        note: 'Automated biometric signal; not absolute proof of identity. May require human review.'
    };
};

module.exports = {
    initializeHuman,
    getFaceEmbedding,
    compareFaces
};