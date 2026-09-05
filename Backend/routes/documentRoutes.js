const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ─── DOCUMENT UPLOAD ──────────────────────────────────────────────────────────
router.post('/upload', protect, upload.single('document'), documentController.uploadDocument);

// ─── USER'S OWN DOCUMENTS ─────────────────────────────────────────────────────
router.get('/my-documents', protect, documentController.getMyDocuments);

// ─── HUMAN REVIEW ENDPOINTS (Reviewer/Admin) ──────────────────────────────────
// NOTE: These must be registered BEFORE /:id to avoid route collision
router.get('/review/pending', protect, documentController.getPendingReviews);
router.get('/review/:id', protect, documentController.getDocumentForReview);
router.post('/review/:id/decision', protect, documentController.submitReview);

// ─── DOCUMENT DETAIL & FILE ───────────────────────────────────────────────────
router.get('/:id/details', protect, documentController.getDocumentDetails);
router.get('/:id', protect, documentController.getDocument);
router.delete('/:id', protect, documentController.deleteDocument);

// ─── AI SCREENING PIPELINE ───────────────────────────────────────────────────
// POST /:id/process  → main endpoint used by officer portal
// POST /:id/process-ocr → alias for backward compatibility
router.post('/:id/process', protect, documentController.processOCR);
router.post('/:id/process-ocr', protect, documentController.processOCR);

module.exports = router;