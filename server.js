const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes             = require('./routes/authRoutes');
const documentRoutes         = require('./routes/documentRoutes');
const faceVerificationRoutes = require('./routes/faceVerificationRoutes');
const adminRoutes            = require('./routes/adminRoutes');
const reviewRoutes           = require('./routes/reviewRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
let helmet, rateLimit, mongoSanitize;

try { helmet = require('helmet'); } catch (_) { console.warn('[WARN] helmet not installed, HTTP security headers disabled'); }
try { rateLimit = require('express-rate-limit'); } catch (_) { console.warn('[WARN] express-rate-limit not installed, rate limiting disabled'); }
try { mongoSanitize = require('express-mongo-sanitize'); } catch (_) { console.warn('[WARN] express-mongo-sanitize not installed, NoSQL injection protection disabled'); }

if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: false // Allow inline scripts for admin panel
    }));
}

// CORS — restrict to allowed origins in production
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// NoSQL injection sanitization
// NOTE: express-mongo-sanitize v2.2.0 tries to reassign req.query which is
// read-only in this Express/router setup, causing 500 on every request.
// We use a safe inline sanitizer that only touches req.body and req.params.
if (mongoSanitize) {
    // Only sanitize body and params — never reassign req.query (read-only getter)
    app.use((req, res, next) => {
        try {
            if (req.body)   req.body   = mongoSanitize.sanitize(req.body,   { replaceWith: '_' });
            if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
        } catch (_) {
            // sanitize failed silently — do not crash the request
        }
        next();
    });
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
if (rateLimit) {
    // Strict limit for authentication endpoints
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20,
        message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    // General API limiter
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        message: { success: false, message: 'API rate limit exceeded. Please try again shortly.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use('/api/auth', authLimiter);
    app.use('/api', apiLimiter);
}

// ─── HEALTH CHECK (must be before static so it is never shadowed) ─────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'SIH26188 - AI Fake Identity & Document Screening System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/documents',        documentRoutes);
app.use('/api/face-verification',faceVerificationRoutes);
app.use('/api/admin',            adminRoutes);
app.use('/api/reviews',          reviewRoutes);   // standalone review queue

// ─── STATIC FILES (Admin Panel) — after API routes ────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── ROOT FALLBACK ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── ERROR HANDLERS ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── STARTUP ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB();
app.listen(PORT, () => {
    console.log(`\n🛡️  SIH26188 - AI Document Screening System`);
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin Panel:  http://localhost:${PORT}/dashboard.html`);
    console.log(`🔍 Review Panel: http://localhost:${PORT}/review.html`);
    console.log(`📤 Officer UI:   http://localhost:${PORT}/officer.html`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health\n`);
});