const EventEmitter = require('events');
const logger = require('./logger');
// task(data, callback), where callback (err, res)
function scheduler(arr, num_worker, task, callback){
    const sche = new EventEmitter();
    let result_list = new Map();
    let err_list = new Map();
    let worker_counter = 0;
    sche.once('done', ()=>{
        callback(err_list, result_list);
    });

    sche.on('worker_complete', ()=>{
        worker_counter ++;
        if(worker_counter === num_worker){
            sche.emit('done');
        }
    });

    sche.on('next', (i)=>{
        if(i >= arr.length){
            sche.emit('worker_complete');
        }else{
            task(arr[i], (err, res)=>{
                if(err){
                    logger.error(err.message);
                    err_list.set(arr[i], err);
                }else if(res){
                    result_list.set(arr[i], res);
                }
                sche.emit('next', i+num_worker);
            }); 
        }
    });

    let temp_i = 0;
    while(temp_i < num_worker){
        sche.emit('next', temp_i);
        temp_i++;
    }
}

module.exports.scheduler = scheduler;