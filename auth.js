const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {User, validate, updateValidate} = require('./models/user');

module.exports = function(req, res, next){
	const token = req.header('x-auth-token');
	if (!token) return res.status(401).send("Access denied. Token not provided.");
	try{
		let decoded = jwt.verify(token, process.env.privatekey);
		User.findOne({email:decoded.email, is_deleted: false})
			.then((user) => {
				if(user.token.indexOf(token) == -1){
					return res.status(401).send("Access denied. Invalid token.");
				}
				req.user = decoded;
				req.user_type = user.user_type;
				next();
			})
			.catch((err) => { return res.status(401).send("Access denied. Invalid token.");})
	}catch(ex){
		return res.status(401).send("Access denied. Invalid token.");
	}
}