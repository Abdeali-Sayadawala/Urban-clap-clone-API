//importing modules
const {User, validate, updateValidate} = require('../models/user');
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
router.get('/logout', auth, async (req, res) => {
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
router.get('/profile', auth, async (req, res) => {
	const user = await User.findOne({email: req.user.email}).select("-password -token -is_deleted");
	res.send(user);

});

//Add User API
router.post('/addUser', async (req, res) => {
	//joi validate the input
	let validation = validate(req.body);
	if (validation) return res.status(400).send(validation.error.details[0].message);
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
	console.log("check")
	try{
		user = await user.save();
		res.send(user);
	}catch(err){
		res.status(501).send(err.errors[Object.keys(err.errors)[0]].message);
	}
	
});

//Update User API
router.put('/updateUser', auth, async (req, res) => {
	let validation = updateValidate(req.body);
	console.log(validation)
	if (validation) return res.status(400).send(validation.error.details[0].message);
	if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) return res.status(400).send("Email invalid!");
	try{
		const user = await User.updateOne({email: req.user.email}, {
			$set: {
				name: req.body.name,
				email: req.body.email,
				phone: req.body.phone
			}
		});
		return res.send("User properties updated.");
	}catch(err){
		res.status(501).send(err);
	}
	
	
});

//Delete User API
//Change Password API

function validateLogin(data){
	let loginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().min(5).max(255).required(),
	});

	return loginSchema.validate(data);
}

module.exports = router;