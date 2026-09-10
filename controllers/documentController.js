const Document = require('../model/document');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const { extractText } = require('../services/ocrService');
const { validateDocument } = require('../services/validationService');
const { detectFakeDocument } = require('../services/fakeDocumentService');
const { extractDocumentData } = require('../services/documentExtractionService');
const { calculateRisk } = require('../services/riskAssessmentService');

/**
 * Upload an identity document
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document file uploaded'
            });
        }

        const documentType = req.body.documentType || 'passport';

        let fileBuffer = null;
        try {
            fileBuffer = fs.readFileSync(req.file.path);
        } catch (_) {}

        const document = await Document.create({
            user: req.user.id || req.user._id,
            fileName: req.file.originalname,
            filePath: req.file.path,
            documentType: documentType,
            ocrStatus: 'PENDING',
            fileData: fileBuffer,
            fileContentType: req.file.mimetype
        });

        // Run initial OCR text extraction
        try {
            const ocrText = await extractText(req.file.path);
            document.ocrText = ocrText;
            document.ocrStatus = 'COMPLETED';
            await document.save();
        } catch (ocrErr) {
            console.error('Initial OCR warning:', ocrErr.message);
            document.ocrStatus = 'FAILED';
            await document.save();
        }

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Document upload failed',
            error: error.message
        });
    }
};

/**
 * Get authenticated user's documents with pagination and filtering
 */
const getMyDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = {
            user: req.user.id || req.user._id
        };

        if (req.query.status) {
            query.validationStatus = req.query.status.toUpperCase();
        }

        if (req.query.documentType) {
            query.documentType = new RegExp(req.query.documentType, 'i');
        }

        if (req.query.search) {
            query.fileName = new RegExp(req.query.search, 'i');
        }

        const total = await Document.countDocuments(query);
        const documents = await Document.find(query)
            .sort({ uploadedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            count: documents.length,
            documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message
        });
    }
};

/**
 * Get single document file (binary stream)
 */
const getDocument = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const isOwner = document.user.toString() === (req.user.id || req.user._id).toString();
        const isPrivileged = ['ADMIN', 'REVIEWER'].includes(req.user.role);

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this document'
            });
        }

        let filePath = path.resolve(document.filePath);
        if (!fs.existsSync(filePath)) {
            if (document.fileData) {
                const uploadsDir = path.dirname(filePath);
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                fs.writeFileSync(filePath, document.fileData);
                console.log([STORAGE] Restored document file from MongoDB Atlas: );
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Document file not found on storage'
                });
            }
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document',
            error: error.message
        });
    }
};

/**
 * Get document details (JSON metadata & screening result)
 */
const getDocumentDetails = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id)
            .populate('user', 'name email role department')
            .populate('reviewedBy', 'name email role');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const isOwner = document.user._id.toString() === (req.user.id || req.user._id).toString();
        const isPrivileged = ['ADMIN', 'REVIEWER'].includes(req.user.role);

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to access this document metadata'
            });
        }

        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document details',
            error: error.message
        });
    }
};

/**
 * Run complete OCR, extraction, validation, fake detection, and risk assessment pipeline
 */
const processOCR = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const isOwner = document.user.toString() === (req.user.id || req.user._id).toString();
        const isPrivileged = ['ADMIN', 'REVIEWER'].includes(req.user.role);

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to process this document'
            });
        }

        // 1. OCR Extraction
        document.ocrStatus = 'PENDING';
        await document.save();

        let filePath = path.resolve(document.filePath);
        if (!fs.existsSync(filePath)) {
            if (document.fileData) {
                const uploadsDir = path.dirname(filePath);
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                fs.writeFileSync(filePath, document.fileData);
                console.log([STORAGE] Restored document file from MongoDB Atlas: );
            } else {
                document.ocrStatus = 'FAILED';
                await document.save();
                return res.status(404).json({
                    success: false,
                    message: 'Document file missing on disk'
                });
            }
        }

        const ocrText = await extractText(filePath);
        document.ocrText = ocrText;
        document.ocrStatus = 'COMPLETED';

        // 2. Structured Field Extraction
        const extractedData = extractDocumentData(ocrText, document.documentType);
        document.extractedData = extractedData;

        // 3. Document Validation
        const validationResult = validateDocument(document, extractedData);
        document.validationStatus = validationResult.status;
        document.validationDetails = validationResult;

        // 4. Fake / Suspicious Document Detection
        const fakeDetectionResult = await detectFakeDocument(document);
        document.fakeDocumentStatus = fakeDetectionResult.status;
        document.fakeDetectionDetails = fakeDetectionResult;

        // 5. Risk Assessment
        const riskResult = calculateRisk({
            validationResult,
            fakeDetectionResult,
            documentData: extractedData
        });

        document.riskScore = riskResult.riskScore;
        document.riskLevel = riskResult.riskLevel;
        document.riskReasons = riskResult.reasons;

        // Queue for human review if flagged as high risk, suspicious, or validation rejected
        if (
            validationResult.status === 'REJECTED' ||
            validationResult.status === 'NEEDS_REVIEW' ||
            fakeDetectionResult.status === 'SUSPICIOUS' ||
            riskResult.riskLevel === 'HIGH' ||
            riskResult.riskLevel === 'CRITICAL'
        ) {
            if (document.reviewStatus !== 'APPROVED') {
                document.reviewStatus = 'PENDING';
            }
        }

        // 6. Persist complete screening record to DB
        await document.save();

        res.status(200).json({
            success: true,
            message: 'Document screening pipeline completed successfully',
            ocrText: document.ocrText,
            ocrStatus: document.ocrStatus,
            extractedData: document.extractedData,
            validationStatus: document.validationStatus,
            validationDetails: document.validationDetails,
            fakeDocumentStatus: document.fakeDocumentStatus,
            fakeDetectionDetails: document.fakeDetectionDetails,
            riskScore: document.riskScore,
            riskLevel: document.riskLevel,
            riskReasons: document.riskReasons,
            reviewStatus: document.reviewStatus
        });
    } catch (error) {
        console.error('DOCUMENT PIPELINE ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Screening pipeline failed',
            error: error.message
        });
    }
};

/**
 * Get pending human reviews (Reviewer/Admin only)
 */
const getPendingReviews = async (req, res) => {
    try {
        if (!['REVIEWER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Reviewer or Admin only.'
            });
        }

        const documents = await Document.find({
            reviewStatus: 'PENDING'
        })
            .populate('user', 'name email department')
            .sort({ uploadedAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending reviews',
            error: error.message
        });
    }
};

/**
 * Get document for human review (Reviewer/Admin only)
 */
const getDocumentForReview = async (req, res) => {
    try {
        if (!['REVIEWER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Reviewer or Admin only.'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id)
            .populate('user', 'name email department')
            .populate('reviewedBy', 'name email');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch document review details',
            error: error.message
        });
    }
};

/**
 * Submit human review decision (Reviewer/Admin only)
 */
const submitReview = async (req, res) => {
    try {
        if (!['REVIEWER', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Reviewer or Admin only.'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const { reviewDecision, reviewComment } = req.body;
        const allowedDecisions = ['APPROVED', 'REJECTED', 'FALSE_POSITIVE'];

        if (!allowedDecisions.includes(reviewDecision)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review decision. Allowed values: APPROVED, REJECTED, FALSE_POSITIVE'
            });
        }

        document.reviewStatus = reviewDecision;
        document.reviewDecision = reviewDecision;
        document.reviewComment = reviewComment || '';
        document.reviewedBy = req.user.id || req.user._id;
        document.reviewedAt = new Date();

        if (reviewDecision === 'APPROVED' || reviewDecision === 'FALSE_POSITIVE') {
            document.validationStatus = 'VALIDATED';
        } else if (reviewDecision === 'REJECTED') {
            document.validationStatus = 'REJECTED';
        }

        await document.save();

        res.status(200).json({
            success: true,
            message: 'Human review submitted successfully',
            review: {
                documentId: document._id,
                reviewStatus: document.reviewStatus,
                reviewDecision: document.reviewDecision,
                reviewComment: document.reviewComment,
                reviewedBy: document.reviewedBy,
                reviewedAt: document.reviewedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to submit human review',
            error: error.message
        });
    }
};

/**
 * Delete document and remove physical file safely
 */
const deleteDocument = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const isOwner = document.user.toString() === (req.user.id || req.user._id).toString();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this document'
            });
        }

        const filePath = path.resolve(document.filePath);
        if (fs.existsSync(filePath)) {
            try {
                await fs.promises.unlink(filePath);
            } catch (unlinkErr) {
                console.warn('Physical file deletion warning:', unlinkErr.message);
            }
        }

        await Document.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
};

module.exports = {
    uploadDocument,
    getMyDocuments,
    getDocument,
    getDocumentDetails,
    deleteDocument,
    processOCR,
    getPendingReviews,
    getDocumentForReview,
    submitReview
};