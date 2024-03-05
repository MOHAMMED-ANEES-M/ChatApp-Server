const { VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, FORBIDDEN, SERVER_ERROR } = require('../constants').constants;

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    switch (statusCode) {
        case VALIDATION_ERROR:
            res.status(VALIDATION_ERROR).json({ title: "Validation failed", message: err.message, stackTrace: err.stack });
            return;
        case UNAUTHORIZED:
            res.status(UNAUTHORIZED).json({ title: "Unauthorized", message: err.message, stackTrace: err.stack });
            return;
        case NOT_FOUND:
            res.status(NOT_FOUND).json({ title: "Not found", message: err.message, stackTrace: err.stack });
            return;
        case FORBIDDEN:
            res.status(FORBIDDEN).json({ title: "Forbidden", message: err.message, stackTrace: err.stack });
            return;
        case SERVER_ERROR:
            res.status(SERVER_ERROR).json({ title: "Server error", message: err.message, stackTrace: err.stack });
            return;
        default:
            console.log('No error');
            break;
    }
}

module.exports = errorHandler;
