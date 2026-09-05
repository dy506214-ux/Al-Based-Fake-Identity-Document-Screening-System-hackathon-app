/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
};

module.exports = { errorHandler, notFoundHandler };
