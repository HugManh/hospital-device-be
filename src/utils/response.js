/**
 * Response utility class for standardized API responses
 */
class Response {
    /**
     * Success response
     * @param {Object} res - Express response object
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    /**
     * Error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {*} errors - Additional error details
     */
    static error(
        res,
        message = 'Error occurred',
        statusCode = 500,
        errors = null
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    /**
     * Validation error response
     * @param {Object} res - Express response object
     * @param {Array} errors - Validation errors array
     */
    static validationError(res, errors) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors,
        });
    }

    /**
     * Not found response
     * @param {Object} res - Express response object
     * @param {string} message - Not found message
     */
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
        });
    }

    /**
     * Unauthorized response
     * @param {Object} res - Express response object
     * @param {string} message - Unauthorized message
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
        });
    }

    /**
     * Forbidden response
     * @param {Object} res - Express response object
     * @param {string} message - Forbidden message
     */
    static forbidden(res, message = 'Access forbidden') {
        return res.status(403).json({
            success: false,
            message,
        });
    }
}

module.exports = Response;
