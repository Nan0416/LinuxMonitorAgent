const jsonloader = require('./helper-functions/loader').loadjson;
const logger = require('./helper-functions/logger');
const process = require('process');
const system_configuration = jsonloader(".system-config.json");
const user_configuration = jsonloader("configuration.json");
const has_value = require('./helper-functions/common').has_value;
const verify_private_api_key = require('./http-sender/wrapper').verify_private_api_key;
const terminate_monitoring = require('./http-sender/wrapper').terminate_monitoring;
const overall = require('./monitor-operations/monitor-functions').overall;
const post =require('./http-sender/post');


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
let domain = system_configuration['domain'];
let rest_prefix = system_configuration['rest-prefix'];
require('./http-sender/urls').set_domain(domain);
require('./http-sender/urls').set_rest_prefix(rest_prefix);


let account = user_configuration["account"];
let urlEncodedAccount = encodeURIComponent(account);
let private_api_key = user_configuration["private-api-key"];
let handle;
let agent_instance_id = os.hostname();
if(!has_value(user_configuration['agent-id'])){
    agent_instance_id = user_configuration['agent-id'];
}

function start_monitoring(){
    let interval_ = user_configuration["monitor-period"];
    if(has_value(interval_) && typeof(interval_) == 'number' && interval_ >= 1){

    }else{
        interval_ = system_configuration['monitor-period'];
    }
    handle = setInterval(()=>{
        overall(interval_ * 1000, data=>{
            console.log(data);
            post(`${domain}/${rest_prefix}/${urlEncodedAccount}`, agent_instance_id, private_api_key, data);
        });
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
