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
        contentSecurityPolicy: false, // Allow inline scripts for admin panel
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
}

// ─── PRODUCTION CENTRALIZED CORS CONFIGURATION ───────────────────────────
// Supports local Flutter Web development on any localhost/127.0.0.1 port,
// plus production deployed origins (configured via CORS_ORIGIN or default).
const allowedOrigins = [
    'https://sih26188-g7f9.onrender.com',
    'https://sih26188-backend.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : [])
];

// Regex strictly matching localhost or 127.0.0.1 on any HTTP/HTTPS development port (Flutter Web, Vite, React, etc.)
const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]{1,5})?$/;

const corsOptions = {
    origin: (origin, callback) => {
        // 1. Allow mobile native apps, curl, Postman, server-to-server requests (no Origin header)
        if (!origin) {
            return callback(null, true);
        }

        // 2. Allow wildcard or configured production origins
        if (allowedOrigins.includes('*') || process.env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // 3. Allow any local development port on localhost or 127.0.0.1 (e.g. Flutter Web dev server)
        if (LOCALHOST_REGEX.test(origin)) {
            return callback(null, true);
        }

        // 4. In development mode, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // 5. Explicitly reject untrusted cross-origin requests cleanly (null, false)
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Device-Id',
        'X-Client-Version'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200 // Ensure 200 OK for legacy browser preflights
};

// Register centralized CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
const healthHandler = (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'SIH26188 - AI Fake Identity & Document Screening System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/_health', healthHandler);
const unusedHealth = (req, res) => {
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