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
            if(has_value(body) && has_value(body.reasons) && body.reasons.length != 0){
                logger.warn(`HTTP POST Response ${url} ${res.statusMessage} ${res.statusCode} ${body.reasons[0]}`);
            }else{
                logger.warn(`HTTP POST Response ${url} ${res.statusMessage} ${res.statusCode}`);
            }
            if (callback) callback(false, body);
        }else{
            if (callback) callback(true, body);
        }
    });
}

module.exports = post;