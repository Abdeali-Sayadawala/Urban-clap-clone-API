const { User } = require('../models/user');
const { generateJWTtoken,
        checkJWTtoken } = require('../middleware/JWTAuth');
const mongoose = require('mongoose');
const error_logger = require('../helper/helper.error_logger');
const { unauthorized,
        bad_request,
        internal_error,
        success_res } = require('../helper/helper.response')


//User controller functions here
module.exports.loginController = async (req, res) => {
    //this function gets validated data and performs login operation.
    try{
        let user = await User.findOne({email: req.body.email, is_deleted: false});
        if (!user) return unauthorized(res, 'Email or Password Invalid!');
        if (! (req.body.password == user.password) ) return unauthorized(res, 'Email or Password Invalid!');
        const token = await generateJWTtoken(user);
        if (token.status == 0) return internal_error(res);
        return success_res(res, data={'x-auth-token': token.token}, msg='Login Success');
    }catch(ex){
        error_logger(ex, 'loginController');
		return internal_error(res);
    }
}

module.exports.logoutController = async (req, res) => {
    //this function gets auth token from request header and loggs out the user.
    try{
		const user = await User.findOne({email: req.user.email});
		user.token.splice(user.token.indexOf(req.header('x-auth-token')), 1);
		await user.save();
		return success_res(res, [], msg='Logout Success');
	}catch(err){
		error_logger(ex, 'LogoutController');
		return internal_error(res);
	}
}

module.exports.AddUserController = async (req, res) => {
    //this function adds user using the validated data.
    //encrypt password
    try{
        user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
            user_type: req.body.user_type,
        });
        user = await user.save();
		return success_res(res, [], msg='User added succesfully')
    }catch(ex){
        error_logger(ex, 'AddUserController');
		return internal_error(res, msg=ex.errors[Object.keys(ex.errors)[0]].message);
    }
}

module.exports.profileController = async (req, res) => {
    //this function gets the profile data for the logged in user
    try{
        const user = await User.findOne({email: req.user.email}).select("-password -token -is_deleted");
        return success_res(res, data=user, msg='Profile data')
    }catch(ex){
        error_logger(ex, 'profileController');
		return internal_error(res);
    }
}

module.exports.updateUserController = async (req, res) => {
    //this function updates the current user with validated data
    try{
		const user = await User.updateOne({email: req.user.email}, {
			$set: req.body
		});
		return success_res(res, [], msg='User properties updated');
	}catch(err){
		error_logger(ex, 'updateUserController');
		return internal_error(res);
	}
}

module.exports.deleteUserController = async (req, res) => {
    try{
		const user = await User.findOne({email: req.user.email});
		user.is_deleted = true;
		user.token = [];
		await user.save();
		return success_res(res, [], msg='User deleted successfully');
	}catch(err){
		error_logger(ex, 'deleteUserController');
		return internal_error(res);
	}
}

module.exports.changePasswordController = async (req, res) => {
    try{
		User.updateOne({email: req.user.email},{ $set:{ password: req.body.new_password, token: [] } })
			.then(() => {
				return success_res(res, [], msg='Password changed successfully. Please login again in all of your devices.');
			})
			.catch((err) => {
				error_logger(ex, 'deleteUserController');
		        return internal_error(res);
			})
	}catch(err){
		error_logger(ex, 'deleteUserController');
		return internal_error(res);
	}
}