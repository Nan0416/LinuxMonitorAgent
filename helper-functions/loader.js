const fs = require("fs");
const logger = require('./logger');

/* A synchronous method for loading json object from a file */
function loadjson(filepath){
    try{
        let content = fs.readFileSync(filepath);
        return JSON.parse(content);
    }catch(err){
        logger.error(err.message);
    }
    return null;
}
module.exports.loadjson = loadjson;