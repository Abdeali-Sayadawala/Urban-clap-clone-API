const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {User, validate, updateValidate} = require('./models/user');


module.exports = function(user_type, err_msg){
	return function(req, res, next){
			const token = req.header('x-auth-token');
			if (!token) return res.status(401).send("Access denied. Token not provided.");
			console.log("user type in auth: ", user_type)
			try{
				let decoded = jwt.verify(token, process.env.privatekey);
				User.findOne({email:decoded.email, is_deleted: false})
					.then((user) => {
						if(user_type != 0) if (!(user.user_type == user_type)) return res.status(401).send(err_msg);
						if(user.token.indexOf(token) == -1){
							return res.status(401).send("Access denied. Invalid token.");
						}
						req.user = decoded;
						req.user_type = user.user_type;
						next();
					})
					.catch((err) => { return res.status(401).send("User does not exists.");})
			}catch(ex){
				console.log("Error-Auth: ", ex);
				return res.status(401).send("Access denied. Invalid token.");
			}
		};
}