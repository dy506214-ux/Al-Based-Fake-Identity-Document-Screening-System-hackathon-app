const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fileName: {
            type: String,
            required: true  
        },
        filePath: {
            type: String,
            required: true
        },
        documentType: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        ocrText: {
            type: String,
            default: ''
        },
        ocrData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ocrStatus: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        },
        validationStatus: {
            type: String,
            enum: ['PENDING', 'VALIDATED', 'REJECTED', 'NEEDS_REVIEW'],
            default: 'PENDING'
        },
        fakeDocumentStatus: {
            type: String,
            enum: ['PENDING', 'GENUINE', 'SUSPICIOUS'],
            default: 'PENDING'
        },
        riskScore: {
            type: Number,
            default: 0
        },
        riskLevel: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: 'LOW'
        },
        riskReasons: {
            type: [String],
            default: []
        },
        reviewStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED','FALSE_POSITIVE'],
            default: 'PENDING'
        },
        reviewDecision: {
            type: String,
            enum: ['APPROVED', 'REJECTED', 'FALSE_POSITIVE', 'REVIEW_REQUIRED', 'PENDING', null],
            default: null
        },
        fileData: {
            type: Buffer,
            default: null
        },
        fileContentType: {
            type: String,
            default: null
        },
        reviewComment: {
            type: String,
            default: null
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },  
        reviewedAt: {
            type: Date,
            default: null
        },
        extractedData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        validationDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        fakeDetectionDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        faceVerification: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        selfiePath: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

documentSchema.index({ user: 1 });
documentSchema.index({ validationStatus: 1 });
documentSchema.index({ reviewStatus: 1 });
documentSchema.index({ riskLevel: 1 });
documentSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
