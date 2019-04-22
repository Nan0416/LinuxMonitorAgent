const urls = require('./urls');
const POST = require('./post');
function verify_private_api_key(account, key, callback){
    POST(urls.get_verify_private_key_url(), null, {
        "account": account,
        "private-api-key":key,
    }, callback);
}
function terminate_monitoring(account, key, callback){
    POST(urls.get_terminate_monitoring_url(), key, {
        "account": account
    }, callback);
}
module.exports.verify_private_api_key = verify_private_api_key;
module.exports.terminate_monitoring = terminate_monitoring;