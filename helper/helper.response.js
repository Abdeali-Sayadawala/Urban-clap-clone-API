module.exports.unauthorized = (res, msg='', status=401) => {
    res.status(status)
        .header('content-type', 'application/json')
        .send(JSON.stringify({
        statusCode: status,
        data: [],
        message: msg,
        statusMsg: 'Unauthorized'
        }))
};

module.exports.bad_request = (res, msg='', status=400) => {
    res.status(status)
        .header('content-type', 'application/json')
        .send(JSON.stringify({
        statusCode: status,
        data: [],
        message: msg,
        statusMsg: 'Bad Request'
        }))
}

module.exports.internal_error = (res, msg='Internal server error. Please try again later.', status=500) => {
    res.status(status)
        .header('content-type', 'application/json')
        .send(JSON.stringify({
        statusCode: status,
        message: msg,
        statusMsg: 'Error'
        }));
}

module.exports.success_res = (res, data = [], msg='success', status=200) => {
    res.status(status)
        .header('content-type', 'application/json')
        .send(JSON.stringify({
        statusCode: status,
        data: data,
        message: msg,
        statusMsg: 'Success'
        }))
}

module.exports.not_found_res = (res, msg='Requested data not found', status=404) => {
    res.status(status)
        .header('content-type', 'application/json')
        .send(JSON.stringify({
        statusCode: status,
        message: msg,
        }))
}