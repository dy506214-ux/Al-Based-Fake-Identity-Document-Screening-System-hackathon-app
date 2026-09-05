/**
 * API Response Helper
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
    const payload = {
        success: true,
        message
    };
    if (data !== null && data !== undefined) {
        payload.data = data;
    }
    if (meta !== null && meta !== undefined) {
        payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
};

const errorResponse = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
    const payload = {
        success: false,
        message
    };
    if (errors !== null && errors !== undefined) {
        payload.errors = Array.isArray(errors) ? errors : [errors];
    }
    return res.status(statusCode).json(payload);
};

module.exports = { successResponse, errorResponse };
