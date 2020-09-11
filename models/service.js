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

exports.Service = Service;
