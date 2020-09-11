//importing modules
const {User, validate, updateValidate, changePassValidate} = require('../models/user');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');
const { loginValidator,
		addUserValidator,
		updateUserValidator,
		changePasswordValidator } = require('../middleware/validator')

const { loginController,
		logoutController,
		AddUserController,
		profileController,
		updateUserController,
		deleteUserController,
		changePasswordController } = require('../controller/user.controller');

//defining express router
const router = express.Router();

//defining routes for user API
router.post('/login', loginValidator, loginController);
router.get('/logout', logoutController);
router.get('/profile', profileController);
router.post('/addUser', addUserValidator, AddUserController);
router.put('/updateUser', updateUserValidator, updateUserController);
router.delete('/deleteUser', deleteUserController);
router.post('/changePassword', changePasswordValidator, changePasswordController);

module.exports = router;