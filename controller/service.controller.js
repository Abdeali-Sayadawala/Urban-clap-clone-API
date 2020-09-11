const { Service } = require('../models/service');
const { User } = require('../models/user');
const { RequestService } = require('../models/request_service');
const mongoose = require('mongoose');
const error_logger = require('../helper/helper.error_logger');
const { unauthorized,
        bad_request,
        internal_error,
        success_res } = require('../helper/helper.response');

module.exports.listServiceController = async (req, res) => {
    try{
        let services = await Service.find({is_deleted:false}).populate('service_by', '-password -token -is_deleted -user_type').select("-is_deleted");
        return success_res(res, data=services, msg='List of Services');
    }catch(ex){
        error_logger(ex, 'listServiceController');
		return internal_error(res);
    }
}

module.exports.addServiceController = async (req, res) => {
    try{
        let user = await User.findOne({email: req.user.email});
        var service = await Service.findOne({
            service_category: req.body.service_category,
            service_name: req.body.service_name,
            service_by: user
        })
        if (service) return bad_request(res, "Service you are trying to add already exists.");
        service = new Service({
            service_category: req.body.service_category,
            service_name: req.body.service_name,
            service_by: user
        });
        await service.save();
        return success_res(res, [], "service added successfully");
    }catch(ex){
        error_logger(ex, 'addServiceController');
		return internal_error(res);
    }
}

module.exports.requestServiceController = async (req, res) => {
    try{
        let user = await User.findOne({email: req.user.email});

        let request_service = new RequestService({
            service: req.service,
            applied_by: user, 
        })
        await request_service.save();
        return success_res(res, [], "Applied for the service.");
    }catch(ex){
        error_logger(ex, 'requestServiceController');
		return internal_error(res);
    }
}

module.exports.deleteServiceController = async (req, res) => {
    try{
        req.service.is_deleted = true;
        await req.service.save();
        return success_res(res, [], 'Service deleted successfully.');
    }catch(ex){
        error_logger(ex, 'deleteServiceController');
		return internal_error(res);
    }
}