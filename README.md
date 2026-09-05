# SIH26188 — AI-Based Fake Identity & Document Screening System

> Smart India Hackathon 2026 | Team Project | Production-quality backend

---

## 🎯 Overview

An AI-powered backend system for detecting fake/forged identity documents submitted by applicants. The system performs multi-layer screening including OCR, structured data extraction, MRZ checksum verification, heuristic fake detection, biometric face verification, and a human review workflow.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework | Express.js 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| OCR | Tesseract.js 7 |
| Face Verification | @vladmandic/human 3.3.6 + TF.js WASM |
| Image Processing | sharp, canvas |
| Security | helmet, express-rate-limit, express-mongo-sanitize |
| Frontend | Vanilla HTML/CSS/JS (no framework) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- `.env` file configured (see below)

### Installation

```bash
npm install
```

### Environment Variables (`.env`)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/sih26188
JWT_SECRET=your-strong-secret-key
FACE_MATCH_THRESHOLD=0.60
NODE_ENV=development
```

### Run

```bash
# Development
npm start

# Run all tests
npm test
```

---

## 🌐 Application URLs

| Page | URL |
|------|-----|
| Login | `http://localhost:3000/` |
| Admin Dashboard | `http://localhost:3000/dashboard.html` |
| Human Review Panel | `http://localhost:3000/review.html` |
| Officer Upload Portal | `http://localhost:3000/officer.html` |
| Health Check | `http://localhost:3000/api/health` |

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new officer account |
| POST | `/login` | Login and receive JWT token |
| GET  | `/profile` | Get authenticated user profile |

### Documents (`/api/documents`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | USER | Upload document (triggers initial OCR) |
| GET | `/my-documents` | USER | List own documents with pagination |
| GET | `/:id` | OWNER/REVIEWER/ADMIN | Download document file |
| GET | `/:id/details` | OWNER/REVIEWER/ADMIN | Get document JSON metadata |
| DELETE | `/:id` | OWNER/ADMIN | Delete document |
| POST | `/:id/process` | OWNER/REVIEWER/ADMIN | Run full AI screening pipeline |
| GET | `/review/pending` | REVIEWER/ADMIN | Get all pending review documents |
| GET | `/review/:id` | REVIEWER/ADMIN | Get single document for review |
| POST | `/review/:id/decision` | REVIEWER/ADMIN | Submit review decision |

### Face Verification (`/api/face-verification`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/verify` | USER | Compare two face images directly |
| POST | `/document/:documentId` | USER | Verify selfie against document portrait |

### Admin (`/api/admin`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | System-wide statistics |
| GET | `/users` | List all users (paginated) |
| PATCH | `/users/:id` | Update user role/status |
| DELETE | `/users/:id` | Deactivate user account |
| GET | `/documents` | All documents with full filters |
| GET | `/audit-logs` | Paginated audit trail |

---

## 🔬 AI Screening Pipeline

```
Document Upload
     │
     ▼
1. OCR (Tesseract.js)          → Raw text extraction
     │
     ▼
2. Field Extraction            → Name, DOB, expiry, passport/Aadhaar/PAN number, gender, MRZ
     │
     ▼
3. Document Validation         → Expiry check, required fields, MRZ checksum (ICAO), format checks
     │
     ▼
4. Fake Document Detection     → Heuristic checks, font anomalies, spacing patterns, contradictions
     │
     ▼
5. Risk Assessment             → Weighted composite score (0–100), risk level (LOW/MEDIUM/HIGH/CRITICAL)
     │
     ▼
6. Human Review Queue          → Auto-queued if HIGH/CRITICAL risk or REJECTED/SUSPICIOUS status
     │
     ▼
7. Face Verification (Optional)→ Selfie vs document portrait (Human.js + WASM, cosine similarity)
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| OFFICER | Upload documents, run screening, view own documents |
| REVIEWER | All officer permissions + human review queue access |
| ADMIN | All permissions + user management + audit logs |

> Note: Public registration defaults to OFFICER. Admin must manually promote accounts.

---

## 🔒 Security Features

- **JWT authentication** with 1-day expiry and DB-level user active status check
- **bcryptjs** password hashing (salt rounds: 10)
- **Helmet** HTTP security headers
- **Rate limiting**: 20 auth requests / 300 API requests per 15 minutes
- **express-mongo-sanitize** NoSQL injection protection
- **Role-based access control** on all sensitive endpoints
- **Audit logging** for all authentication and admin actions
- **File type validation** in upload middleware
- **Input size limits** (2MB JSON/body)

---

## 🧪 Testing

```bash
npm test
```

Runs Phase 1 (stabilization) and Phase 2 (screening pipeline) automated tests.

---

## 📁 Project Structure

```
SIH26188/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── adminController.js       # Admin CRUD operations
│   ├── authController.js        # Registration, login, profile
│   ├── documentController.js    # Upload, process, review
│   └── faceVerificationController.js
├── middleware/
│   ├── authMiddleware.js        # JWT protect + authorizeRoles
│   ├── errorMiddleware.js       # Global error handler
│   └── uploadMiddleware.js      # Multer file upload
├── model/
│   ├── auditLog.js              # Audit trail model
│   ├── document.js              # Document screening model
│   └── user.js                  # User model
├── public/                      # Frontend HTML pages
│   ├── index.html               # Login
│   ├── dashboard.html           # Admin dashboard
│   ├── review.html              # Review panel
│   └── officer.html             # Officer upload portal
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── documentRoutes.js
│   └── faceVerificationRoutes.js
├── services/
│   ├── auditService.js          # Audit logging
│   ├── documentExtractionService.js  # OCR field extraction + MRZ
│   ├── faceVerificationService.js    # Human.js WASM face embed
│   ├── fakeDocumentService.js        # Heuristic fake detection
│   ├── ocrService.js                 # Tesseract OCR
│   ├── riskAssessmentService.js      # Composite risk scoring
│   └── validationService.js          # Document field validation
├── test/
│   ├── phase1.test.js
│   ├── phase2.test.js
│   ├── phase3.test.js
│   └── runTests.js              # Master test runner
├── utils/
│   └── apiResponse.js           # Standard API response helpers
├── uploads/                     # Uploaded document storage
├── server.js                    # Express app entry point
├── .env                         # Environment config (not committed)
└── package.json
```
