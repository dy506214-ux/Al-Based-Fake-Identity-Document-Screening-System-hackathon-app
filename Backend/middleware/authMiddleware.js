const jwt = require("jsonwebtoken");
const User = require("../model/user");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authorization header missing or malformed' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check active status in database
        try {
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ success: false, message: 'User associated with this token no longer exists' });
            }
            if (user.isActive === false) {
                return res.status(403).json({ success: false, message: 'User account is inactive' });
            }
            req.user = {
                id: user._id.toString(),
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };
        } catch (dbError) {
            // Fallback to token payload if DB query encounters temporary issue
            req.user = decoded;
        }

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user?.role || 'ANONYMOUS'}' is not authorized to access this resource.`
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };