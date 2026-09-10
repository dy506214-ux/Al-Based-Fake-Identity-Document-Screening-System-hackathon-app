const fs = require('fs');
const path = require('path');
const Document = require('../model/document');
const { compareFaces } = require('../services/faceVerificationService');
const { calculateRisk } = require('../services/riskAssessmentService');

/**
 * Compare two face images directly
 */
const verifyFaces = async (req, res) => {
    let image1Path;
    let image2Path;

    try {
        if (!req.files || !req.files.image1 || !req.files.image2) {
            return res.status(400).json({
                success: false,
                message: 'Please upload both image1 and image2'
            });
        }

        image1Path = req.files.image1[0].path;
        image2Path = req.files.image2[0].path;

        const result = await compareFaces(image1Path, image2Path);

        // Cleanup temporary comparison images
        if (fs.existsSync(image1Path)) {
            try { fs.unlinkSync(image1Path); } catch (e) {}
        }
        if (fs.existsSync(image2Path)) {
            try { fs.unlinkSync(image2Path); } catch (e) {}
        }

        res.status(200).json({
            success: true,
            message: result.verified ? 'Faces matched successfully' : 'Faces do not match',
            data: result
        });
    } catch (error) {
        if (image1Path && fs.existsSync(image1Path)) {
            try { fs.unlinkSync(image1Path); } catch (e) {}
        }
        if (image2Path && fs.existsSync(image2Path)) {
            try { fs.unlinkSync(image2Path); } catch (e) {}
        }

        res.status(500).json({
            success: false,
            message: 'Face verification failed',
            error: error.message
        });
    }
};

/**
 * Verify an existing document against a live selfie image
 */
const verifyDocumentFace = async (req, res) => {
    let selfiePath = null;
    try {
        const { documentId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a selfie image'
            });
        }

        selfiePath = req.file.path;

        const document = await Document.findById(documentId);
        if (!document) {
            if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        let documentPath = path.resolve(document.filePath);
        if (!fs.existsSync(documentPath)) {
            if (document.fileData) {
                const uploadsDir = path.dirname(documentPath);
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                fs.writeFileSync(documentPath, document.fileData);
                console.log([STORAGE] Restored document file for Face Verification: );
            } else {
                if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
                return res.status(404).json({
                    success: false,
                    message: 'Document file not found on storage'
                });
            }
        }

        // Compare document portrait with selfie
        const result = await compareFaces(documentPath, selfiePath);

        // Store verification details into the document
        document.faceVerification = {
            ...result,
            verifiedAt: new Date()
        };
        document.selfiePath = selfiePath;

        // Re-calculate risk score incorporating biometric face signal
        const updatedRisk = calculateRisk({
            validationResult: document.validationDetails,
            fakeDetectionResult: document.fakeDetectionDetails,
            faceVerificationResult: result,
            documentData: document.extractedData
        });

        document.riskScore = updatedRisk.riskScore;
        document.riskLevel = updatedRisk.riskLevel;
        document.riskReasons = updatedRisk.reasons;

        if (!result.verified || updatedRisk.riskLevel === 'HIGH' || updatedRisk.riskLevel === 'CRITICAL') {
            document.reviewStatus = 'PENDING';
        }

        await document.save();

        res.status(200).json({
            success: true,
            message: result.verified ? 'Face verification passed' : 'Face verification failed threshold',
            faceVerification: document.faceVerification,
            riskScore: document.riskScore,
            riskLevel: document.riskLevel,
            riskReasons: document.riskReasons
        });
    } catch (error) {
        console.error('DOCUMENT FACE VERIFICATION ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Document face verification failed',
            error: error.message
        });
    }
};

module.exports = {
    verifyFaces,
    verifyDocumentFace
};