const express = require('express');
const router = express.Router();
const path = require('path');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getPendingReviews, getDocumentForReview, submitReview } = require('../controllers/documentController');

// All review routes require Reviewer or Admin role
router.use(protect, authorizeRoles('REVIEWER', 'ADMIN'));

// List all pending reviews
router.get('/pending', getPendingReviews);

// Get a single document for review
router.get('/:id', getDocumentForReview);

// Submit review decision
router.post('/:id/decision', submitReview);

module.exports = router;
