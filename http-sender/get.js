const request = require('request');
const logger = require('../helper-functions/logger');

function get(url, agent_id, callback){
    let options = {
        uri: url,
        method:"GET",
        form:{
            "agent-id": agent_id
        }
    };

    request(options, (err, res, body)=>{
        if(err){
            logger.error(err.message);
            callback(false, null);
        }else if(res.statusCode != 200){
            logger.warn(`HTTP GET Response ${url} ${res.statusMessage} ${res.statusCode}`);
            callback(false, body);
        }else{
            callback(true, body);
        }
    });
}

module.exports = get;