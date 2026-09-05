const bcrypt = require('bcryptjs');
const User = require('../model/user');
const jwt = require("jsonwebtoken");
const { logAuditEvent } = require('../services/auditService');

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Security Rule: Public registration strictly defaults to OFFICER
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'OFFICER'
        });

        // Record audit event
        await logAuditEvent({
            actor: newUser._id,
            actorEmail: newUser.email,
            actorRole: newUser.role,
            action: 'REGISTRATION',
            resource: 'USER',
            resourceId: newUser._id,
            req,
            metadata: { name: newUser.name, role: newUser.role }
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            logAuditEvent({
                actorEmail: email,
                action: 'LOGIN_ATTEMPT',
                resource: 'AUTH',
                status: 'FAILURE',
                req,
                metadata: { reason: 'User not found' }
            });
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            logAuditEvent({
                actor: user._id,
                actorEmail: user.email,
                actorRole: user.role,
                action: 'LOGIN_ATTEMPT',
                resource: 'AUTH',
                status: 'FAILURE',
                req,
                metadata: { reason: 'Inactive account' }
            });
            return res.status(403).json({ success: false, message: 'User account is inactive' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logAuditEvent({
                actor: user._id,
                actorEmail: user.email,
                actorRole: user.role,
                action: 'LOGIN_ATTEMPT',
                resource: 'AUTH',
                status: 'FAILURE',
                req,
                metadata: { reason: 'Invalid password' }
            });
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        await logAuditEvent({
            actor: user._id,
            actorEmail: user.email,
            actorRole: user.role,
            action: 'LOGIN',
            resource: 'AUTH',
            resourceId: user._id,
            status: 'SUCCESS',
            req
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
};

module.exports = { registerUser, loginUser, getProfile };
