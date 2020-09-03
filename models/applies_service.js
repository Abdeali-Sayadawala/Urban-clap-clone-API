const joi = require('joi');
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
	comment_by:{
		type:String,
		required:true
	},
	comment_text:{
		type:String,
		required:true
	}
});

const applied_schema = new mongoose.Schema({
	service:{
		type:Schema.Types.ObjectId,
		ref:'Service',
		required:true,
	},
	applied_by:{
		type:Schema.Types.ObjectId,
		ref:'User',
		required:true,
	},
	status:{
		type:String,
		required:true,
	},
	comments:{
		type:commentSchema,
		required:true,
	},
});

const AppliedSchema = mongoose.model('AppliedSchema', applied_schema);

function validateComments(comment){
	let val_com_schema = Joi.object({
		comment_by: Joi.String().max(255).required(),
		comment_text: Joi.String().required(),
	});

	return val_com_schema.validate(comment);
}

function validateAppliedService(applied_service){
	let applies_schema = Joi.object({
		service: Joi.string().required(),
		applied_by: Joi.string().required(),
		status: Joi.string().required()
	})
}

exports.AppliedSchema = AppliedSchema;
exports.validateComments = validateComments;
exports.validateAppliedService = validateAppliedService;