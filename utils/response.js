export function sendSuccess(response, status, data = null, meta = {}) {
    return response.status(status).json({
        data,
        error: null,
        meta,
    });
}

export function sendError(response, status, error, meta = {}) {
    return response.status(status).json({
        data: null,
        error,
        meta,
    });
}
