const Joi = require('joi');
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
	comment_by:{
		type:String,
		enum: { values: ['Customer', 'ServiceProvider'], message: "Select from only two 'Customer' or 'ServiceProvider'"},
		required:true
	},
	comment_text:{
		type:String,
		required:true
	}
});

const applied_schema = new mongoose.Schema({
	service:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'Service',
		required:true,
	},
	applied_by:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'User',
		required:true,
	},
	status:{
		type:String,
		enum: {
			values: ['Pending', 'Accepted', 'Rejected', 'Completed'],
			message: "Status field can only have 'Pending', 'Accepted', 'Rejected' and 'Completed'"
		},
		default:'Pending'
	},
	comments:[{
		type:commentSchema,
	}],
	is_deleted:{
		type: Boolean,
		default: false
	}
});

const AppliedService = mongoose.model('AppliedSchema', applied_schema);

function validateComments(comment){
	let val_com_schema = Joi.object({
		applied_service_id: Joi.string().required(),
		comment_text: Joi.string().required(),
	});

	return val_com_schema.validate(comment);
}

function validateStatus(status){
	let val_stat_schema = Joi.object({
		applied_service_id: Joi.string().required(),
		status: Joi.string().required(),
	});

	return val_stat_schema.validate(status);
}

function validateAppliedService(applied_service){
	let applies_schema = Joi.object({
		service: Joi.string().required(),
		applied_by: Joi.string().required(),
		status: Joi.string().required()
	})
}

exports.AppliedService = AppliedService;
exports.validateComments = validateComments;
exports.validateStatus = validateStatus;
exports.validateAppliedService = validateAppliedService;