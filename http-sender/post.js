const request = require('request');
const logger = require('../helper-functions/logger');
const has_value = require('../helper-functions/common').has_value;

function post(url, agent_id, private_key, data_, callback){
    let options = {
        uri: url,
        method:"POST"
    };
    if(has_value(private_key)){
        options['json'] = {
            "key": private_key,
            "agent-id": agent_id,
            "data": data_,
        };
    }else{
        options['json'] = {
            "agent-id":agent_id,
            "data": data_,
        };
    };
    request(options, (err, res, body)=>{
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

module.exports = post;