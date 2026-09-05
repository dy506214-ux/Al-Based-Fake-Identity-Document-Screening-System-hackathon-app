const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * AI-based Fake / Suspicious Document Detection Pipeline
 * Analyzes file integrity, image resolution, OCR patterns, and MRZ consistency.
 * Produces a structured risk assessment without unsupported forensic claims.
 */
const detectFakeDocument = async (document) => {
    const reasons = [];
    const indicators = [];
    let suspicionScore = 0;

    const text = String(document.ocrText || "").toUpperCase().trim();
    const documentType = String(document.documentType || "passport").toLowerCase().trim();

    // ==========================================
    // 1. FILE INTEGRITY CHECK
    // ==========================================
    let filePath = null;

    if (!document.filePath) {
        reasons.push("Document file reference is missing");
        indicators.push({
            type: "FILE",
            severity: "HIGH",
            message: "Document file reference missing"
        });
        suspicionScore += 30;
    } else {
        filePath = path.resolve(document.filePath);
        if (!fs.existsSync(filePath)) {
            reasons.push("Referenced file cannot be located on storage");
            indicators.push({
                type: "FILE",
                severity: "HIGH",
                message: "Physical document file not found on disk"
            });
            suspicionScore += 30;
        }
    }

    // ==========================================
    // 2. OCR TEXT DENSITY & PLAUSIBILITY
    // ==========================================
    if (!text) {
        reasons.push("No readable optical character data extracted");
        indicators.push({
            type: "OCR_DENSITY",
            severity: "HIGH",
            message: "Zero readable optical characters identified"
        });
        suspicionScore += 25;
    } else if (text.length < 30) {
        reasons.push("Extracted text volume is unusually low for an identity credential");
        indicators.push({
            type: "OCR_DENSITY",
            severity: "MEDIUM",
            message: `Low character count detected: ${text.length} chars`
        });
        suspicionScore += 15;
    }

    // ==========================================
    // 3. IMAGE QUALITY & DIMENSION ANALYSIS
    // ==========================================
    if (filePath && fs.existsSync(filePath)) {
        try {
            const image = sharp(filePath);
            const metadata = await image.metadata();

            const supportedFormats = ["jpeg", "jpg", "png", "webp", "tiff"];
            if (!metadata.format || !supportedFormats.includes(metadata.format)) {
                reasons.push(`Non-standard image format: ${metadata.format || 'unknown'}`);
                indicators.push({
                    type: "IMAGE_FORMAT",
                    severity: "LOW",
                    message: `Format detected: ${metadata.format}`
                });
                suspicionScore += 10;
            }

            // Resolution evaluation
            if (metadata.width && metadata.height) {
                if (metadata.width < 400 || metadata.height < 300) {
                    reasons.push("Image resolution is significantly below biometric inspection thresholds");
                    indicators.push({
                        type: "IMAGE_RESOLUTION",
                        severity: "MEDIUM",
                        message: `Resolution (${metadata.width}x${metadata.height}) is too low for reliable screening`
                    });
                    suspicionScore += 20;
                }
            }

            // EXIF check for editing software tags (Photoshop, GIMP, Canva)
            if (metadata.exif) {
                const exifStr = metadata.exif.toString('utf8');
                if (/photoshop|gimp|canva|picsart/i.test(exifStr)) {
                    reasons.push("Image metadata indicates potential software modification/editing");
                    indicators.push({
                        type: "METADATA_TAMPERING",
                        severity: "HIGH",
                        message: "Editing software signature identified in EXIF tags"
                    });
                    suspicionScore += 30;
                }
            }
        } catch (imageErr) {
            reasons.push("Document image stream could not be validated for corruption");
            indicators.push({
                type: "IMAGE_CORRUPTION",
                severity: "HIGH",
                message: "Image buffer read error"
            });
            suspicionScore += 25;
        }
    }

    // ==========================================
    // 4. DOCUMENT-SPECIFIC STRUCTURAL PATTERNS
    // ==========================================
    if (documentType === "passport") {
        const hasMrzPattern = /P<[A-Z0-9<]{10,}/.test(text);
        if (!hasMrzPattern) {
            reasons.push("Machine Readable Zone (MRZ) structure not found in passport scan");
            indicators.push({
                type: "MRZ_MISSING",
                severity: "HIGH",
                message: "Standard ICAO MRZ banner missing"
            });
            suspicionScore += 25;
        }

        const hasPassportNumber = /\b[A-Z0-9]{7,10}\b/.test(text);
        if (!hasPassportNumber) {
            reasons.push("Standard alphanumeric document serial identifier not identified");
            indicators.push({
                type: "SERIAL_MISSING",
                severity: "MEDIUM",
                message: "No standard document serial detected"
            });
            suspicionScore += 15;
        }
    }

    // Determine final status
    const status = (suspicionScore >= 35 || reasons.length >= 2) ? "SUSPICIOUS" : "GENUINE";

    return {
        status,
        suspicionScore: Math.min(suspicionScore, 100),
        assessment: status === "SUSPICIOUS" ? "requires review" : "likely valid",
        reasons,
        indicators
    };
};

module.exports = {
    detectFakeDocument
};