const jsonloader = require('./helper-functions/loader').loadjson;
const logger = require('./helper-functions/logger');
const process = require('process');
const system_configuration = jsonloader(".system-config.json");
const user_configuration = jsonloader("configuration.json");
const has_value = require('./helper-functions/common').has_value;
const verify_private_api_key = require('./http-sender/wrapper').verify_private_api_key;
const terminate_monitoring = require('./http-sender/wrapper').terminate_monitoring;

if(!has_value(user_configuration)){
    logger.error("Missing configuration file");
    return;
}
if(!has_value(user_configuration["account"])){
    logger.error("Missing account");
    return;
}
if(!has_value(user_configuration["private-api-key"])){
    logger.error("Missing private-api-key");
    return;
}
// initialization
require('./http-sender/urls').set_domain(system_configuration['domain']);
require('./http-sender/urls').set_rest_prefix(system_configuration['rest-prefix']);

let account = user_configuration["account"];
let private_api_key = user_configuration["private-api-key"];
let handle;

function start_monitoring(){
    let interval_ = user_configuration["monitor-period"];
    if(has_value(interval_) && typeof(interval_) == 'number' && interval_ >= 1){

    }else{
        interval_ = system_configuration['monitor-period'];
    }
    handle = setInterval(()=>{
        console.log("sending");
    }, interval_ * 1000)
    return handle;
}



// drivers

verify_private_api_key(account, private_api_key, (success, data)=>{
    /*if(!success){
        console.log("Error", data);
    }*/
    // set listen
    process.on('SIGINT', () => {
        console.log(`About to exit with code:`);
        clearInterval(handle);
        terminate_monitoring(account, private_api_key, (success, data)=>{
            console.log(success, data);
        });
    });
    start_monitoring();
});
