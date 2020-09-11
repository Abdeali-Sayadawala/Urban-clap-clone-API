//importing modules
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { Service } = require('../models/service');
const { RequestService } = require('../models/request_service');
const { success_res,
        bad_request,
        unauthorized,
        internal_error,
        not_found_res} = require('../helper/helper.response');
const error_logger = require('../helper/helper.error_logger');

module.exports.listRequestController = async (req, res) => {
    try{
        var query;
        if(req.user.user_type == 'Customer') query = {applied_by: req.user._id, is_deleted:false};
        else if(req.user.user_type == 'ServiceProvider') query = {is_deleted:false};
        let applied = await RequestService.find(query).populate({
            path: 'service',
            select: 'service_category service_name service_by -_id'
        }).select('-comments');
        if(!applied) return not_found_res(res, "This service does not exists");
        if (req.user.user_type == 'ServiceProvider'){
            var applied_sp = []
            for (ob in applied){
                console.log(ob)
                if (applied[ob].service.service_by == req.user._id){
                    applied_sp.push(applied[ob]);
                }
            }
            return success_res(res, data=applied_sp, 'Your requested services.');
        }else{
            return success_res(res, data=applied, 'Your requested services.');
        }
    }catch(ex){
        error_logger(ex, 'listRequestController');
        return internal_error(res, "Internal server error");
    }
}

module.exports.listSpecificRequestController = async (req, res) => {
    try{
        var query
        if (req.user.user_type == 'Customer') query = {_id: req.params.id, applied_by: req.user._id, is_deleted:false}
        else query = {_id: req.params.id, is_deleted:false}
        let applied = await RequestService.findOne(query).populate({
            path: 'service',
            select: 'service_category service_name -_id',
            populate: {
                path: 'service_by',
                select: 'name email phone'
            }
        }).populate({
            path: 'applied_by',
            select: 'name email phone'
        })
        if(!applied) return not_found_res(res, "This service does not exists");
        if (req.user.user_type == 'ServiceProvider' && applied.service.service_by._id != req.user._id) return not_found_res(res, "This service does not exists");
        return success_res(res, applied, 'Request service details');
    }catch(err){
        error_logger(ex, 'listSpecificRequestController')
        return internal_error(res, "Internal server error");
    }
}

module.exports.commentRequestController = async (req, res) => {
    try{
        var comment = {
            comment_by: req.user.user_type,
            comment_text: req.body.comment_text
        };
        req.applied_service.comments.push(comment);
        await req.applied_service.save();
        return success_res(res, comment, 'Comment successfull.');
    }catch(ex){
        error_logger(ex, 'commentRequestController')
        return internal_error(res, "Internal server error");
    }
}

module.exports.changeStatusController = async (req, res) => {
    try{
        req.applied_service.status = req.body.status;
        await req.applied_service.save();
        success_res(res, [], "Status Changed successfully.");
    }catch(ex){
        error_logger(ex, 'changeStatusController')
        return internal_error(res, "Internal server error");
    }
}

module.exports.deleteRequestController = async (req, res) => {
    try{
        req.applied_service.is_deleted = true;
        await req.applied_service.save();
        success_res(res, [], "Service request deleted");
    }catch(ex){
        error_logger(ex, 'deleteRequestController')
        return internal_error(res, "Internal server error");
    }
}