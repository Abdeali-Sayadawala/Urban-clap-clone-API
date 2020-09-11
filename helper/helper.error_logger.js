const {env} = require('../config/config');


module.exports = (msg, function_name) => {
    if (env == 'dev'){
        console.log(function_name+"->"+msg);
    }
}