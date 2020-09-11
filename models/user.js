const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name:{
		type:String,
		required:true,
		maxlength:30
	},
	email:{
		type:String,
		required:true,
		unique:true,
	},
	phone:{
		type:Number,
		required:true,
		maxlength:10,
		minlength:10,
		unique:true,
	},
	password:{
		type:String,
		required:true,
	},
	user_type:{
		type:String,
		enum: { values: ['Customer', 'ServiceProvider'], message: "Select from only two 'Customer' or 'ServiceProvider'"},
		required:true,
	},
	token:[{
		type:String
	}],
	is_deleted:{
		type:Boolean,
		default:false
	}
});

const User = mongoose.model('User', userSchema);

exports.User = User;
