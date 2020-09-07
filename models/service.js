const Joi = require('joi');
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
	service_category:{
		type:String,
		required:true,
		maxlength:50
	},
	service_name:{
		type:String,
		required:true,
		maxlength:50
	},
	service_by:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required:true
	},
	is_deleted:{
		type:Boolean,
		default:false
	}
});

const Service = mongoose.model('Service', serviceSchema);

function validateService(service){
	let service_schema = Joi.object({
		service_category: Joi.string().max(50).required(),
		service_name: Joi.string().max(50).required(),
		is_deleted: Joi.boolean()
	});

	return service_schema.validate(service);
}

function applyServiceValidation(service){
	let applySchema = Joi.object({
		service_id: Joi.string().required()
	});

	return applySchema.validate(service);
}

exports.Service = Service;
exports.serviceValidate = validateService;
exports.applyServiceValidate = applyServiceValidation;