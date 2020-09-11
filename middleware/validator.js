const Joi = require('joi');
const { bad_request,
		unauthorized,
		not_found_res,
		internal_error } = require('../helper/helper.response');
const { User } = require('../models/user');
const { Service } = require('../models/service');
const { RequestService } = require('../models/request_service');
const error_logger = require('../helper/helper.error_logger');
const mongoose = require('mongoose');

module.exports.loginValidator = (req, res, next) => {
    let loginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(5).max(255).required(),
	});

    let {validation, error} = loginSchema.validate(req.body);
    if(error) return bad_request(res, error.details[0].message);
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return bad_request(res, 'Email Invalid!');
    next();
}

module.exports.addUserValidator = async (req, res, next) => {
    let user_schema = Joi.object({
		name: Joi.string().max(30).required(),
		email: Joi.string().email().required(),
		phone: Joi.string().min(10).max(10).required(),
		password: Joi.string().min(5).max(255).required(),
		user_type: Joi.string().required(),
		is_deleted: Joi.boolean().optional()
	});
    let {validation, error} = user_schema.validate(req.body);

    if (error) {
		if (error.details[0].type == 'string.min') return bad_request(res, "Please enter number greater than 10");
		if (error.details[0].type == 'string.max') return bad_request(res, "Please enter number less than 11");
		else return bad_request(res, error.details[0].message);
	};
	if (!Number(req.body.phone)) return bad_request(res, "Please enter valid number");
	if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return bad_request(res, "Email invalid!");

	//find if email already exists
	let user = await User.findOne({email: req.body.email});
	if (user) return bad_request(res, "Email already exists!");

	//find if phone number already exists
	let user_phone = await User.findOne({phone: req.body.phone});
    if (user_phone) return bad_request(res, "Phone already exists!");
    next();
}

module.exports.updateUserValidator = async (req, res, next) => {
    let updateSchema = Joi.object({
		name: Joi.string().max(30),
		email: Joi.string().email(),
		phone: Joi.string().min(10).max(10),
	});

    let {validation, error} =  updateSchema.validate(req.body);
    if (error) {
		if (error.details[0].type == 'string.min') return bad_request(res, "Please enter number greater than 10");
		if (error.details[0].type == 'string.max') return bad_request(res, "Please enter number less than 11");
		else return bad_request(res, error.details[0].message);
	};
	if (req.body.phone && !Number(req.body.phone)) return bad_request(res, "Please enter valid number");
    if (req.body.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return bad_request(res, "Email invalid!");
    next();
}

module.exports.changePasswordValidator = async (req, res, next) => {
    let changePassSchema = Joi.object({
		old_password: Joi.string().min(5).max(255).required(),
		new_password: Joi.string().min(5).max(255).required()
	});

    const {validation, error} = changePassSchema.validate(req.body);
    if(error) return bad_request(res, error.details[0].message);
    if(req.body.old_password == req.body.new_password) return bad_request(res, 'Old password and New password cannot be the same.');

    let user = await User.findOne({email: req.user.email});
    if(!(user.password == req.body.old_password)) return bad_request(res, "Invalid current password");
    next();
}

module.exports.addServiceValidator = async (req, res, next) => {
	if (req.user.user_type != 'ServiceProvider') return unauthorized(res, msg='Only service provider can add a service.');
	let service_schema = Joi.object({
		service_category: Joi.string().max(50).required(),
		service_name: Joi.string().max(50).required(),
		is_deleted: Joi.boolean()
	});

	const {validation, error} =  service_schema.validate(req.body);
	if (error) return bad_request(res, error.details[0].message);
	next();
}

module.exports.requestServiceValidator = async (req, res, next) => {
	if (req.user.user_type != 'Customer') return unauthorized(res, msg='Only customer can request for service.');
	let applySchema = Joi.object({
		service_id: Joi.string().required()
	});

	const {validation, error} = applySchema.validate(req.body);
	if(error) return bad_request(req, error.details[0].message);
	try{
		let service = await Service.findOne({_id: req.body.service_id});
		if (!service) return not_found_res(res, "Service with the given ID was not found");
		req.service = service;
		let request_service = await RequestService.find({service:req.body.service_id, applied_by:req.user._id})
		if(request_service){
			console.log(request_service)
			for (obj in request_service){
				if (['Accepted', 'Pending'].indexOf(request_service[obj].status) != -1) return bad_request(res, 'You have already applied for this service, please finish it before appling again.');
			}
		}
		next();
	}catch(ex){
		error_logger(ex, 'requestServiceValidator');
		return internal_error(res);
	}
}

module.exports.deleteServiceValidator = async (req, res, next) => {
	try{
		if (req.user.user_type != 'ServiceProvider') return unauthorized(res, 'Only service provider can delete his/her own service.');
		let service = await Service.findOne({
            _id: req.params.id,
            service_by: req.user._id,
            is_deleted:false,
        });
        if(!service) return not_found_res(res, "This service does not exists");
		let applied_service = await RequestService.find({ service:service });
		if(applied_service){
			var accepted = 0
            for (obj in applied_service){
                if(applied_service[obj].status == "Accepted"){
                    accepted += 1;
                }
            }
            if (accepted) return bad_request(res, "This service has accepted requests please complete them before deleting this service.");
		}
		req.service = service;
		next();
	}catch(ex){
		error_logger(ex, 'deleteServiceValidator');
		return internal_error(res);
	}
}

module.exports.commentRequestValidator = async (req, res, next) => {
	try{
		let val_com_schema = Joi.object({
			applied_service_id: Joi.string().required(),
			comment_text: Joi.string().required(),
		});
	
		let {validation, error} = val_com_schema.validate(req.body);
		if (error) return bad_request(res, error.details[0].message);
		let applied_service = await RequestService.findOne({_id:req.body.applied_service_id, is_deleted:false}).populate('service');
		if(!applied_service) return not_found_res(res, "This service request does not exists");
		if(req.user._id != applied_service.applied_by && req.user._id != applied_service.service.service_by) return not_found_res(res, "This service request does not exists");
		if(applied_service.service.is_deleted == true) return bad_request(res, "This service request is deleted by the service provider.");
		if(applied_service.status!="Accepted") return bad_request(res, "This service request is not Accepted or already is completed.")
		req.applied_service = applied_service;
		next();
	}catch(ex){
		error_logger(ex, 'commentRequestValidator');
		return internal_error(res);
	}
}

module.exports.changeStatusValidator = async (req, res, next) => {
	try{
		if(req.user.user_type != "ServiceProvider") return bad_request(res, 'Service status can only be changed by service provider');
		let val_stat_schema = Joi.object({
			applied_service_id: Joi.string().required(),
			status: Joi.string().required(),
		});
		const {validation, error} =  val_stat_schema.validate(req.body);
		if(error) return bad_request(res, error.details[0].message);
		if(['Pending', 'Completed', 'Accepted', 'Rejected'].indexOf(req.body.status) == -1) return bad_request(res, "Status field can only have 'Pending', 'Accepted', 'Rejected' and 'Completed'")
        let applied_service = await RequestService.findOne({_id: req.body.applied_service_id, is_deleted:false}).populate('service')
        if(!applied_service) return not_found_res(res, "This service request does not exists");
        if(applied_service.service.is_deleted == true) return bad_request(res, "This service is deleted by the service provider.");
		if(applied_service.status == "Accepted" && req.body.status == "Rejected") return bad_request(res, "Request cannot be Rejected as it is already Accepted")
		req.applied_service = applied_service;
		next();
	}catch(ex){
		error_logger(ex, 'changeStatusValidator');
		return internal_error(res);
	}
}

module.exports.deleteRequestValidator = async (req, res, next) => {
	try{
		if(req.user.user_type != 'Customer') return bad_request(res, 'Only customer can delete service request.')
		let applied_service = await RequestService.findOne({_id: req.params.id, applied_by:req.user._id, is_deleted:false});
        if(!applied_service) return not_found_res(res, "Service request with the given ID was not found");
		if(applied_service.status == "Accepted") return bad_request(res, "Service request is already accepted, so cannot be delete");
		req.applied_service = applied_service;
		next();
	}catch(ex){
		error_logger(ex, 'deleteRequestValidator');
		return internal_error(res);
	}
}