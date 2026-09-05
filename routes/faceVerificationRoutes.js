const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
    verifyFaces,
    verifyDocumentFace
} = require('../controllers/faceVerificationController');

// 1. Direct comparison of two uploaded faces
router.post(
    '/verify',
    protect,
    upload.fields([
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 }
    ]),
    verifyFaces
);

// 2. Compare stored document portrait with live selfie
router.post(
    '/verify-document/:documentId',
    protect,
    upload.single('selfie'),
    verifyDocumentFace
);

module.exports = router;