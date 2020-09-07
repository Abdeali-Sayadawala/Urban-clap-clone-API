//importing installed modules
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')

//importing routes
const users = require('./routes/users');
const services = require('./routes/services');
const appliedServices = require('./routes/applied_services');


//dependencies error
if(!process.env.PORT){
	console.log("WARNING: PORT is not set.");
}
if(!process.env.connection_string){
	console.log("ERROR: connection_string is not set.");
	process.exit()
}
if(!process.env.privatekey){
	console.log("ERROR: privatekey is not set.");
	process.exit()
}

//mongoDB connect
mongoose.connect(process.env.connection_string)
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

//express api's
app.use('/api/users', users);
app.use('/api/services', services);
app.use('/api/applied', appliedServices);
app.get('/',(req, res) => {
	res.send("Welcome to urban clap api's.");
});

const port = process.env.PORT || 8000
app.listen(port, () => {console.log(`Listening on port : ${port}`)})
