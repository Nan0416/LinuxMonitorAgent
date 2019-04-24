const fs = require("fs");
const logger = require('./logger');

/* A synchronous method for saving json object to a file */
function jsonsaver(filepath, jsondata){
    let jsonstr = JSON.stringify(jsondata, null, 2);
    try{
        fs.writeFileSync(filepath, jsonstr, 'utf8');
        return true;
    }catch(err){
        logger.error(err.message);
    }
    return false;
}
module.exports.jsonsaver = jsonsaver;