const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { JWTsecret, authFreeUrls } = require('../config/config');
const error_logger = require('../helper/helper.error_logger');
const { unauthorized } = require('../helper/helper.response');


module.exports.generateJWTtoken = async (userdata) => {
    try{
        var token = jwt.sign({_id: userdata._id, email: userdata.email, user_type: userdata.user_type}, JWTsecret);
        let user = await User.findOne({email: userdata.email})
        user.token.push(token);
        await user.save();
        return {'status':1, 'token':token};
    }catch(ex){
        error_logger(ex, 'generateJWTtoken');
        return {'status':0, 'error':ex};
    }
}

module.exports.checkJWTtoken = async (req, res, next) => {
    let token = req.header('x-auth-token');
    if(token){
        try{
            let decoded = jwt.verify(token, JWTsecret);
            User.findOne({email:decoded.email, is_deleted: false})
                .then((user) => {
                    if(user.token.indexOf(token) == -1){
                        return unauthorized(res, 'Access denied, Invalid token.');
                    }
                    req.user = decoded;
                    next();
                })
                .catch((err) => { return unauthorized(res, 'Access denied, Invalid token.');})
        }catch(ex){
            error_logger(ex, 'checkJWTtoken');
            return unauthorized(res, 'Access denied, Invalid token.');
        }
    }else{
        if (authFreeUrls.indexOf(req.originalUrl) != -1){
            next();
        }else{
            return unauthorized(res, 'Access token not provided.');
        }
    }
}