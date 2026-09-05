const AuditLog = require('../model/auditLog');

/**
 * Record an audit log entry asynchronously
 */
const logAuditEvent = async ({
    actor = null,
    actorEmail = 'system',
    actorRole = 'ANONYMOUS',
    action,
    resource,
    resourceId = null,
    status = 'SUCCESS',
    req = null,
    metadata = {}
}) => {
    try {
        let ipAddress = null;
        let userAgent = null;

        if (req) {
            ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
            userAgent = req.headers['user-agent'] || null;

            if (!actor && req.user) {
                actor = req.user._id || req.user.id;
                actorEmail = req.user.email || actorEmail;
                actorRole = req.user.role || actorRole;
            }
        }

        // Clean metadata to avoid circular references or passwords
        const safeMetadata = { ...metadata };
        delete safeMetadata.password;
        delete safeMetadata.token;

        await AuditLog.create({
            actor,
            actorEmail,
            actorRole,
            action,
            resource,
            resourceId: resourceId ? String(resourceId) : null,
            status,
            ipAddress,
            userAgent,
            metadata: safeMetadata
        });
    } catch (error) {
        console.error('[AUDIT LOG ERROR] Failed to record audit log:', error.message);
    }
};

module.exports = {
    logAuditEvent
};
