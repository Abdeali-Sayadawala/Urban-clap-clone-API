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

userSchema.methods.generateAuthToken = async function(){
	try{
		const token = jwt.sign({_id: this._id, email: this.email}, process.env.privatekey)
		this.token.push(token);
		let result = await this.save()
		return {"status":1, "token":token};
	}catch(err){
		return {"status":0, "error":err};
	}
}

const User = mongoose.model('User', userSchema);

function validateUser(user){
	let user_schema = Joi.object({
		name: Joi.string().max(30).required(),
		email: Joi.string().email().required(),
		phone: Joi.number().min(10).max(10).required(),
		password: Joi.string().min(5).max(255).required(),
		user_type: Joi.string().required(),
		is_deleted: Joi.boolean().optional()
	});

	return user_schema.validate(user);
}

function updateUserValidate(user){
	let updateSchema = Joi.object({
		name: Joi.string().max(30),
		email: Joi.string().email(),
		phone: Joi.number().greater(9),
	})

	return updateSchema.validate(user);
}

exports.User = User;
exports.validate = validateUser;
exports.updateValidate = updateUserValidate;
