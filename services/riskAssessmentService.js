/**
 * Centralized Risk Assessment Engine
 * Consolidates signals from Document Validation, Fake Document Analysis,
 * and Biometric Face Verification into an explainable composite risk profile.
 */

const RISK_WEIGHTS = {
    VALIDATION_REJECTED: 40,
    VALIDATION_NEEDS_REVIEW: 20,
    FAKE_SUSPICIOUS: 35,
    FACE_MISMATCH: 40,
    FACE_LOW_CONFIDENCE: 20,
    DOCUMENT_EXPIRED: 30,
    MRZ_CHECKSUM_FAILURE: 25
};

const calculateRisk = ({
    validationResult,
    fakeDetectionResult,
    faceVerificationResult,
    documentData
}) => {
    let score = 0;
    const reasons = [];
    const signals = [];

    // 1. Validation Signals
    if (validationResult?.status === "REJECTED") {
        score += RISK_WEIGHTS.VALIDATION_REJECTED;
        reasons.push("Document failed compliance validation checks");
        signals.push({ source: "VALIDATION", level: "HIGH", points: RISK_WEIGHTS.VALIDATION_REJECTED });
    } else if (validationResult?.status === "NEEDS_REVIEW") {
        score += RISK_WEIGHTS.VALIDATION_NEEDS_REVIEW;
        reasons.push("Document has warnings requiring human verification");
        signals.push({ source: "VALIDATION", level: "MEDIUM", points: RISK_WEIGHTS.VALIDATION_NEEDS_REVIEW });
    }

    // 2. Suspicious Document Signals
    if (fakeDetectionResult?.status === "SUSPICIOUS") {
        score += RISK_WEIGHTS.FAKE_SUSPICIOUS;
        reasons.push("Anomalies or potential tampering indicators detected");
        signals.push({ source: "TAMPERING", level: "HIGH", points: RISK_WEIGHTS.FAKE_SUSPICIOUS });
    }

    // 3. MRZ Specific Failure
    if (documentData?.mrzData?.checksumValid === false) {
        score += RISK_WEIGHTS.MRZ_CHECKSUM_FAILURE;
        reasons.push("Machine Readable Zone (MRZ) checksum verification failed");
        signals.push({ source: "MRZ", level: "HIGH", points: RISK_WEIGHTS.MRZ_CHECKSUM_FAILURE });
    }

    // 4. Biometric Face Verification Signals (if performed)
    if (faceVerificationResult) {
        if (faceVerificationResult.verified === false) {
            score += RISK_WEIGHTS.FACE_MISMATCH;
            reasons.push("Biometric face match failed between selfie and credential portrait");
            signals.push({ source: "BIOMETRIC", level: "HIGH", points: RISK_WEIGHTS.FACE_MISMATCH });
        } else if (faceVerificationResult.face1Confidence < 0.7 || faceVerificationResult.face2Confidence < 0.7) {
            score += RISK_WEIGHTS.FACE_LOW_CONFIDENCE;
            reasons.push("Biometric face detection confidence is marginally low");
            signals.push({ source: "BIOMETRIC", level: "MEDIUM", points: RISK_WEIGHTS.FACE_LOW_CONFIDENCE });
        }
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // 5. Determine Standardized Risk Level
    let riskLevel = "LOW";
    if (score >= 85) {
        riskLevel = "CRITICAL";
    } else if (score >= 60) {
        riskLevel = "HIGH";
    } else if (score >= 30) {
        riskLevel = "MEDIUM";
    } else {
        riskLevel = "LOW";
    }

    return {
        riskScore: score,
        riskLevel,
        reasons,
        signals
    };
};

module.exports = {
    calculateRisk,
    RISK_WEIGHTS
};