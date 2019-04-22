const exec = require('./helper_functions').exec;
const scheduler = require('./helper_functions').scheduler;
function ping(targets, callback){
    if(typeof targets === 'string'){
        targets = [targets];
    }
    scheduler(targets, 5, (target_ip, callback)=>{
        exec(`ping ${target_ip} -c 3`, (err, resp)=>{
            if(err){
                callback(err);
            }else{
                let data = resp.response.split('\n');
                data =  parseFloat(data[data.length - 2].split('/')[4]);
                callback(null,data);
            }
        });
    }, (errs, vals)=>{
        let err = null;
        if(errs.size != 0){
            let err_msg = {};
            for(let [key, val] of errs){
                err_msg[key]=val.message;
            }
            err = new Error(JSON.stringify(err_msg));
        }
        let val_ = {};
        for(let [key, val] of vals){
            val_[key] = val;
        }
        callback(err, val_);
    });
}

module.exports.ping = ping;