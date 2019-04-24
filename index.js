const jsonloader = require('./helper-functions/loader').loadjson;
const jsonsaver = require('./helper-functions/saver').jsonsaver;
const logger = require('./helper-functions/logger');
const process = require('process');

const has_value = require('./helper-functions/common').has_value;
const add_agent = require('./http-sender/wrapper').add_agent;
// const terminate_monitoring = require('./http-sender/wrapper').terminate_monitoring;
const overall = require('./monitor-operations/monitor-functions').overall;
const post =require('./http-sender/post');

const system_configuration = jsonloader("./.system-config.json");
const user_configuration = jsonloader("./configuration.json");


if(!has_value(user_configuration)){
    logger.error("Missing configuration file");
    return;
}
if(!has_value(user_configuration["private-api-key"])){
    logger.error("Missing private-api-key");
    return;
}
// initialization
let domain = system_configuration['domain'];
let url_prefix = system_configuration['url-prefix'];
let key = user_configuration["private-api-key"];
let agent_type = system_configuration['agent-type'];
let task = {
    "handle": null
};
process.on('SIGINT', () => {
    if(has_value(task.handle)){
        console.log(`About to exit with code:`);
        clearInterval(task.handle);
        /*terminate_monitoring(account, private_api_key, (success, data)=>{
            console.log(success, data);
        });*/
    }
});

function start_monitoring(agentid){
    let interval_ = user_configuration["monitor-period"];
    if(has_value(interval_) && typeof(interval_) == 'number' && interval_ >= 1){

    }else{
        interval_ = system_configuration['monitor-period'];
    }
    let temp_handle = setInterval(()=>{
        overall(interval_ * 1000, data=>{
            if(data.success){
                post(`${domain}${url_prefix}/plugin/${agent_type}`, agentid, key, data.value);
            }else{
                logger.warn(data.reasons[0]);
            }
            
        });
    }, interval_ * 1000)
    return temp_handle;
}

// 1. check if has agent-id, if has start running.
if(!has_value(system_configuration['agent-id'])){
    // 2. if not, verify and create instance
    add_agent(`${domain}${url_prefix}/agentinstance/add`, agent_type, key, (success, data)=>{
        if(!success || !data.success){
            if(has_value(data) && has_value(data.success)){
                logger.warn(data.success[0]);
            }
            console.log(`Make sure you have privilege to create the ${agent_type} agent`);
            return;
        }else{
            let agentid = data.value._id;
            // store in persistent
            system_configuration['agent-id'] = agentid;
            if(!jsonsaver('.system-config.json', system_configuration)){
                logger.warn(`Failed to saving agent instance id`);
            }
           let handle = start_monitoring(agentid);
           task.handle = handle;
        }
    });
}else{
    console.log(`Used existed agentid: ${system_configuration['agent-id']}`);
    let handle = start_monitoring(system_configuration['agent-id']);
    task.handle = handle;
}
