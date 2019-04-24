const request = require('request');
const logger = require('../helper-functions/logger');
const has_value = require('../helper-functions/common').has_value;

// callback(success, data)
function add_agent(url, agent_type, key, callback){
    let option = {
        uri: url,
        method:"POST",
        json:{
            agenttype: agent_type,
            key: key,
        }
    };
    request(option, (err, res, body)=>{
        if(err){
            logger.error(err.message);
            if (callback) callback(false, null);
        }else if(res.statusCode != 200){
            logger.warn(`HTTP POST Response ${url} ${res.statusMessage} ${res.statusCode}`);
            if (callback) callback(false, body);
        }else{
            if (callback) callback(true, body);
        }
    });
}

function verify_privilege(url, privilege, key, callback){
    let option = {
        uri: url,
        method:"POST",
        json:{
            privilege: privilege,
            key:key,
        }
    };
    request(option, (err, res, body)=>{
        if(err){
            logger.error(err.message);
            if (callback) callback(false, null);
        }else if(res.statusCode != 200){
            logger.warn(`HTTP POST Response ${url} ${res.statusMessage} ${res.statusCode}`);
            if (callback) callback(false, body);
        }else{
            if (callback) callback(true, body);
        }
    });
}

module.exports.verify_privilege = verify_privilege;
module.exports.add_agent = add_agent;