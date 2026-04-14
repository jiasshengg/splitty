module.exports = {
    /* Status 201 Created */
    confirmCreated(res, data, message = 'success', statusCode = 201) {
        return res.status(statusCode).json({message, status: `${statusCode} Created`, data})
    },

    /* Status 200 OK */
    sendSuccess(res, data, message = 'success', statusCode = 200) {
        return res.status(200).json({message, status: `${statusCode} OK`, data});
    },

    /* Status 204 No Content */
    noContent(res, data, message = 'error', statusCode = 204) {
        return res.status(statusCode).json({message, status: `${statusCode} No Content`, data: data})
    },
    
    /* Status 500 Error */
    sendError(res, message, error = null, statusCode = 500) {
        return res.status(statusCode).json({message, status: `${statusCode} error`, error: error?.message || error?.toString()})
    },

    /* Status 409 Conflict */
    Conflict(res, message, statusCode = 409) {
        return res.status(statusCode).json({message, status: `${statusCode} Conflict`})
    },

    /* Status 400 Bad Request */
    BadRequest(res, message, statusCode = 400) {
        return res.status(statusCode).json({message, status: `${statusCode} Bad Request`})
    },

    /* Status 404 Not Found */
    NotFound(res, message, statusCode = 404) {
        return res.status(statusCode).json({message, status: `${statusCode} Not Found`})
    },

    /* Status 403 Forbidden */
    Forbidden(res, message, statusCode = 403) {
        return res.status(statusCode).json({message, status: `${statusCode} Forbidden`})
    },

    /* Status 401 Unauthorized */
    Unauthorized(res, message, statusCode = 401) {
        return res.status(statusCode).json({message, status: `${statusCode} Unauthorized`})
    }
}