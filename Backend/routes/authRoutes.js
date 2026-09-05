const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', protect, getProfile);

module.exports = router;