const mongoose = require('mongoose');
const User = require('../model/user');
const Document = require('../model/document');
const AuditLog = require('../model/auditLog');
const { logAuditEvent } = require('../services/auditService');

/**
 * GET /api/admin/users
 * List all users with pagination and optional search
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.role) query.role = req.query.role.toUpperCase();
        if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
        if (req.query.search) {
            query.$or = [
                { name: new RegExp(req.query.search, 'i') },
                { email: new RegExp(req.query.search, 'i') }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

/**
 * PATCH /api/admin/users/:id
 * Update user role or active status
 */
const updateUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const allowedRoles = ['OFFICER', 'REVIEWER', 'ADMIN'];
        const { role, isActive } = req.body;

        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent self-demotion
        if (req.params.id === (req.user.id || req.user._id).toString()) {
            return res.status(400).json({ success: false, message: 'Administrators cannot modify their own account via this endpoint' });
        }

        const changes = {};
        if (role !== undefined) { user.role = role; changes.role = role; }
        if (isActive !== undefined) { user.isActive = isActive; changes.isActive = isActive; }

        await user.save();

        await logAuditEvent({
            req,
            action: 'ADMIN_UPDATE_USER',
            resource: 'USER',
            resourceId: user._id,
            metadata: { changes, targetEmail: user.email }
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    }
};

/**
 * GET /api/admin/stats
 * System-wide statistics dashboard data
 */
const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalDocuments,
            pendingReviews,
            approvedDocs,
            rejectedDocs,
            suspiciousDocs,
            criticalRisk,
            highRisk,
            recentAuditLogs
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            Document.countDocuments(),
            Document.countDocuments({ reviewStatus: 'PENDING' }),
            Document.countDocuments({ reviewStatus: 'APPROVED' }),
            Document.countDocuments({ reviewStatus: 'REJECTED' }),
            Document.countDocuments({ fakeDocumentStatus: 'SUSPICIOUS' }),
            Document.countDocuments({ riskLevel: 'CRITICAL' }),
            Document.countDocuments({ riskLevel: 'HIGH' }),
            AuditLog.find().sort({ createdAt: -1 }).limit(10).select('action resource actorEmail status createdAt')
        ]);

        // Documents uploaded in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentDocuments = await Document.countDocuments({ uploadedAt: { $gte: sevenDaysAgo } });

        res.status(200).json({
            success: true,
            stats: {
                users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
                documents: {
                    total: totalDocuments,
                    recentWeek: recentDocuments,
                    pendingReview: pendingReviews,
                    approved: approvedDocs,
                    rejected: rejectedDocs,
                    suspicious: suspiciousDocs
                },
                risk: {
                    critical: criticalRisk,
                    high: highRisk
                }
            },
            recentAuditLogs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
    }
};

/**
 * GET /api/admin/audit-logs
 * Paginated audit log viewer
 */
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.action) query.action = new RegExp(req.query.action, 'i');
        if (req.query.resource) query.resource = new RegExp(req.query.resource, 'i');
        if (req.query.status) query.status = req.query.status.toUpperCase();
        if (req.query.actorEmail) query.actorEmail = new RegExp(req.query.actorEmail, 'i');

        // Date range filter
        if (req.query.from || req.query.to) {
            query.createdAt = {};
            if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
            if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('actor', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            count: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
    }
};

/**
 * GET /api/admin/documents
 * All documents with full filtering for admin oversight
 */
const getAllDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.validationStatus) query.validationStatus = req.query.validationStatus.toUpperCase();
        if (req.query.reviewStatus) query.reviewStatus = req.query.reviewStatus.toUpperCase();
        if (req.query.riskLevel) query.riskLevel = req.query.riskLevel.toUpperCase();
        if (req.query.fakeDocumentStatus) query.fakeDocumentStatus = req.query.fakeDocumentStatus.toUpperCase();
        if (req.query.documentType) query.documentType = new RegExp(req.query.documentType, 'i');

        const total = await Document.countDocuments(query);
        const documents = await Document.find(query)
            .populate('user', 'name email department role')
            .populate('reviewedBy', 'name email')
            .sort({ uploadedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1,
            count: documents.length,
            documents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Deactivate (soft-delete) a user account
 */
const deactivateUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.params.id === (req.user.id || req.user._id).toString()) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await logAuditEvent({
            req,
            action: 'ADMIN_DEACTIVATE_USER',
            resource: 'USER',
            resourceId: user._id,
            metadata: { targetEmail: user.email }
        });

        res.status(200).json({ success: true, message: 'User deactivated successfully', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to deactivate user', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    updateUser,
    getStats,
    getAuditLogs,
    getAllDocuments,
    deactivateUser
};
