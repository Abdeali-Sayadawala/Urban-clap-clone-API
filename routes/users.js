//importing modules
const {User, validate, updateValidate, changePassValidate} = require('../models/user');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');

//defining express router
const router = express.Router();

//defining routes for user API
//Login API
router.post('/login', async (req, res) => {
	const {validate_result} = validateLogin(req.body);
	if(validate_result) return res.status(401).send(validate_result.details[0].message);
	if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return res.status(400).send("Email invalid!");

	let user = await User.findOne({email: req.body.email, is_deleted: false});
	if (!user) return res.status(400).send("Email or password invalid!");

	if (! (req.body.password == user.password) ) return res.status(400).send("Email or password invalid!");

	const token = await user.generateAuthToken();
	if (token.status == 0) res.status(500).send("Internal server error. Please try again later");

	res.header('x-auth-token', token.token).send({"token": token.token});
});

//Logout API
router.get('/logout', auth(0, ""), async (req, res) => {
	try{
		const user = await User.findOne({email: req.user.email});
		user.token.splice(user.token.indexOf(req.header('x-auth-token')), 1);
		await user.save();
		return res.send("Success");
	}catch(err){
		console.log("Error", err);
		return res.status(500).send("Internal server error. Please try again later.");
	}
})

//Profile API
router.get('/profile', auth(0, ""), async (req, res) => {
	const user = await User.findOne({email: req.user.email}).select("-password -token -is_deleted");
	res.send(user);

});

//Add User API
router.post('/addUser', async (req, res) => {
	//joi validate the input
	let {validation, error} = validate(req.body);
	if (error) {
		if (error.details[0].type == 'string.min') return res.status(400).send("Please enter number greater than 10");
		if (error.details[0].type == 'string.max') return res.status(400).send("Please enter number less than 11");
		else return res.status(400).send(error.details[0].message);
	};
	if (!Number(req.body.phone)) return res.status(400).send("Please enter valid number");
	if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return res.status(400).send("Email invalid!");

	//find if email already exists
	let user = await User.findOne({email: req.body.email});
	if (user) return res.status(400).send("Email already exists!");

	//find if phone number already exists
	let user_phone = await User.findOne({phone: req.body.phone});
	if (user_phone) return res.status(400).send("Phone already exists!");

	//encrypt password
	//add data to database if all validated
	user = new User({
		name: req.body.name,
		email: req.body.email,
		phone: req.body.phone,
		password: req.body.password,
		user_type: req.body.user_type,
	});
	try{
		user = await user.save();
		res.send(user);
	}catch(err){
		res.status(501).send(err.errors[Object.keys(err.errors)[0]].message);
	}
});

//Update User API
router.put('/updateUser', auth(0, ""), async (req, res) => {
	let {validation, error} = updateValidate(req.body);
	if (error) {
		if (error.details[0].type == 'string.min') return res.status(400).send("Please enter number greater than 10");
		if (error.details[0].type == 'string.max') return res.status(400).send("Please enter number less than 11");
		else return res.status(400).send(error.details[0].message);
	};
	if (req.body.phone && !Number(req.body.phone)) return res.status(400).send("Please enter valid number");
	if (req.body.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return res.status(400).send("Email invalid!");
	try{
		const user = await User.updateOne({email: req.user.email}, {
			$set: req.body
		});
		return res.send("User properties updated.");
	}catch(err){
		console.log("Error-Update user: "+err);
		res.status(501).send("Internal server error!");
	}
});

//Delete User API
router.delete('/deleteUser', auth(0, ""), async (req, res) => {
	try{
		const user = await User.findOne({email: req.user.email});
		user.is_deleted = true;
		user.token = [];
		await user.save();
		res.send("deleted");
	}catch(err){
		console.log("Error-Delete user: ", err);
	}
});

//Change Password API
router.post('/changePassword', auth(0, ""), async (req, res) => {
	try{
		let validation = changePassValidate(req.body);
		if (validation.error) return res.status(400).send(validation.error.details[0].message);

		if(req.body.new_password==req.body.old_password) return res.status(400).send("old password and new password cannot be same.");

		let user = await User.findOne({email: req.user.email});
		if(!(user.password == req.body.old_password)) return res.status(400).send("Invalid current password");

		User.updateOne({email: req.user.email},{ $set:{ password: req.body.new_password, token: [] } })
			.then(() => {
				res.send("Password Changed");
			})
			.catch((err) => {
				console.log("Error-Change password update: ", err);
				res.status(500).send("Internal server error");
			})
	}catch(err){
		console.log("Error-Change password: ", err);
		res.status(500).send("Internal server error");
	}
})

function validateLogin(data){
	let loginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(5).max(255).required(),
	});

	return loginSchema.validate(data);
}

module.exports = router;