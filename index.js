//importing installed modules
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const { connection_string } = require('./config/config');
const { checkJWTtoken } = require('./middleware/JWTAuth');

//importing routes
const users = require('./routes/users');
const services = require('./routes/services');
const requestServices = require('./routes/request_services');


//dependencies error
if(!process.env.PORT){
	console.log("WARNING: PORT is not set.");
}

//mongoDB connect
mongoose.connect(connection_string)
	.then(() => {
		console.log("MongoDB connected.")
	})
	.catch((error) => {
		console.log("MongoDB could not be connected.:")
		console.log(error)
	})

//express dependencies
const app = express();
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(checkJWTtoken);

//express api's
app.use('/api/users', users);
app.use('/api/services', services);
app.use('/api/request', requestServices);
app.get('/',(req, res) => {
	res.send("Welcome to urban clap api's.");
});

const port = process.env.PORT || 8000
app.listen(port, () => {console.log(`Listening on port : ${port}`)})
