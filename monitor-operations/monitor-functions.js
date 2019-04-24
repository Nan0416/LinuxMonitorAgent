const os = require('os');
const fs = require('fs');
const async = require('async');
/**
 * "data":{
		"loadavg":[1,1,1],
		"corenum":4,
		"cpuuser":0.2,
		"cpusys":0.2,
		"memtotal":2319231430,
		"memfree":343425233,
		"memavail":2343432,
		"disk":[
			{
				"name":"sdb",
				"write":343,
				"read":2434
			},{
				"name":"sda",
				"write":34,
				"read":434
			}
		]
	}
 */
function decimal(number, percision){
    percision = Math.pow(10, percision);
    return Math.round(number * percision) / percision;
}

/**
 * 
 * @param {*} [period] A millisecond time period, default 100
 * @param {*} callback A callback function whose arguments are err and the cpu load
 */
function CPU(period, callback){
    if(typeof period === 'function'){
        callback = period;
        period = 100;
    }
    let t1 = os.cpus();
    setTimeout(()=>{
        let t2 = os.cpus();
        let result = [];
        for(let i = 0; i < t1.length; i++){
            result.push(__loadPerCore(t1[i].times, t2[i].times));
        }
        let overview = {user: 0, sys: 0};
        for(let i = 0; i < result.length; i++){
            overview.user += result[i].user;
            overview.sys += result[i].sys;

            result[i].user = decimal(result[i].user, 4);
            result[i].sys = decimal(result[i].sys, 4);
        }
        overview.user = decimal(overview.user / result.length , 4);
        overview.sys = decimal(overview.sys / result.length, 4);
        callback(null, {
            overview: overview,
            cores: result,
            corenum: result.length,
            timestamp: Date.now()
        })
    }, period);
    //clearInterval(timeout_);
}
function __loadPerCore(t1, t2){
    //{ user: 73130, nice: 0, sys: 58950, idle: 16388980, irq: 0 }
    let diff_user = t2.user - t1.user;
    let diff_sys = t2.sys - t1.sys;
    let diff_idle = t2.idle - t1.idle;
    let sum = (diff_idle + diff_sys + diff_user);
    return {
        user: (diff_user / sum), 
        sys: (diff_sys/ sum)
    };
}
/////////////////////////////////////////////////////////////////////////////////////
//////////////////////// Network /////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
function externalNetInterface(){
    let network_interfaces = os.networkInterfaces();
    let network_interfaces_return = []; // [{name: .., addrs:[type:'ipv4', addr:, netmask]}]
    for(let key in network_interfaces){
        if(network_interfaces.hasOwnProperty(key)){
            let interface = network_interfaces[key];
            let result_interface = {name: key};
            let addrs = [];
            for(let i = 0; i < interface.length; i++){
                let _addr = interface[i];
                if(typeof _addr.internal === 'boolean' && !_addr.internal){
                    let addr = {
                        family: _addr.family,
                        address: _addr.address,
                        netmask: _addr.netmask
                    }
                    addrs.push(addr);
                }
            }
            if(addrs.length !== 0){
                result_interface['addresses'] = addrs;
                network_interfaces_return.push(result_interface);
            }
        }
    }
    return network_interfaces_return;
}
const external_interface = externalNetInterface();
const external_interface_set = new Set();
for(let i = 0; i < external_interface.length; i++){
    external_interface_set.add(external_interface[i].name);
}
function networkIO(period, callback){
    if(typeof period === 'function'){
        callback = period;
        period = 1000;
    }
    readnetdev((err, t1)=>{
        if(err){
            callback(err);
            return;
        }
        setTimeout(()=>{
            readnetdev((err, t2)=>{
                if(err){
                    callback(err);
                    return;
                }
                let result = [];
                external_interface_set.forEach((name)=>{
                    //console.log(name,t2[name], t1[name]);
                    result.push({
                        name: name,
                        in: Math.round((t2[name]['received_bytes'] - t1[name]['received_bytes']) / period * 1000),
                        out: Math.round((t2[name]['transmitted_bytes'] - t1[name]['transmitted_bytes']) / period * 1000),
                    });
                });
                
                callback(null, {
                    timestamp: Date.now(),
                    network_io: result
                });
            });
        }, period)
    });
}
function readnetdev(callback){
    const filepath = '/proc/net/dev';
    fs.readFile(filepath, (err, data)=>{
        if(err){
            callback(err);
            return;
        }
        let result = {};
        let items = data.toString('utf8').split('\n');
        for(let i = 2; i < items.length; i++){
            let item = items[i];
            let name = item.substring(0, item.indexOf(':'));
            let data = item.substring(item.indexOf(':') + 1, item.length).split(' ');
            if(name.lastIndexOf(' ') !== -1){
                name = name.substring(name.lastIndexOf(' ') + 1, name.length);
            }
            if(!external_interface_set.has(name)){
                continue;
            }
            let data_number = [];
            
            for(let i = 0; i < data.length; i++){
                if(data[i] !== ''){
                    data_number.push(parseInt(data[i]));
                }
            }

            result[name] = {
                received_bytes: data_number[0],
                transmitted_bytes: data_number[8]
            };
            
        }
        callback(null, result);
    });
}

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////// Disk io ////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
function __disk_position(){
    const path = '/proc/diskstats';
    const exclusive = new Set();
    exclusive.add('loop'); exclusive.add('ram');exclusive.add('dm');

    let contents = fs.readFileSync(path, 'utf8').split('\n');
    let result = [];
    for(let i = 0; i < contents.length; i++){
        let flag = true;
        exclusive.forEach(ele => {
            if(contents[i].indexOf(ele) !== -1){
                flag = false;
            }
        });
        if(contents[i].length === 0){
            flag = false;
        }
        if(flag){
            result.push(i);
        }
    }
    return result;
}
const disk_p = __disk_position();

function disk_io(){
    const path = '/proc/diskstats';
    let contents = fs.readFileSync(path, 'utf8').split('\n');
    let result = {};
    for(let i = 0; i < disk_p.length; i++){
        let data = [];
        let content = contents[disk_p[i]].split(' ');
        for(let j = 0; j < content.length; j++){
            if(content[j].length !== 0){
                data.push(content[j]);
            }
        }
        result[data[2]] = {
            read: parseInt(data[5]) * 512,
            write: parseInt(data[9]) * 512
        }
    }
    return result;
}

function diskIO(period, callback){
    if(typeof period === 'function'){
        callback = period;
        period = 1000;
    }
    let t1 = disk_io();
    let result = [];
    setTimeout(()=>{
        let t2 = disk_io();
        for(let disk_name in t1){
            if(t1.hasOwnProperty(disk_name)){
                
                t2[disk_name].read -= t1[disk_name].read;
                t2[disk_name].write -= t1[disk_name].write;

                t2[disk_name].read = t2[disk_name].read / period * 1000;
                t2[disk_name].write = t2[disk_name].write / period * 1000;
                result.push({
                    name: disk_name,
                    read: t2[disk_name].read,
                    write: t2[disk_name].write
                })
            }
        }
        callback(null, {
            timestamp: Date.now(),
            disk_io: result
        });
        
    }, period);
}


/////////////////////////////////////////////////////////////////////////////////////
//////////////////////// Memory /////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

function memory(callback){
    const filepath = '/proc/meminfo';
    fs.readFile(filepath, (err, data)=>{
        if(err){
            callback(err);
            return;
        }
        let items = data.toString('utf8').split('\n');
        const required_fields = new Set([
            "MemTotal:", 
            "MemFree:", 
            "MemAvailable:",
            "Buffers:",
            "Cached:",
            "SwapTotal:",
            "SwapFree:",
        ]);
        const value = {};
        for(let i = 0; i < items.length; i++){
            let str = items[i].split(' ');
            if(required_fields.has(str[0])){
                let key = str[0].substring(0, str[0].length - 1);
                value[key] = parseInt(str[str.length - 2]);
            }
        }
        value['timestamp'] = Date.now();
        callback(null, value);
    });
}

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////// CPU static info ////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
function systeminfo(callback){
    const filepath = '/proc/cpuinfo';
    fs.readFile(filepath, (err, data)=>{
        if(err){
            callback(err);
            return;
        }
        try{
            let items = data.toString('utf8').split('\n');
            let cpu_model = "";
            let number_cpu = 0;
            const value = {};
            for(let i = 0; i < items.length; i++){
                let item_name = items[i].substring(0, items[i].indexOf('\t'));
                if(item_name === 'processor'){
                    number_cpu ++;
                }
                if(item_name === 'model name'){
                    cpu_model = items[i].substring(items[i].indexOf(':') + 2, items[i].length);
                }
            }
  
            value['network_interfaces'] = external_interface;
            value['hostname'] = os.hostname();
            value['arch'] = os.arch();
            value['kernel'] = os.type() + ' ' + os.release();
            value['#core'] = number_cpu;
            value['model'] = cpu_model;
            value['timestamp'] = Date.now();


            callback(null, value);
        }catch(err){
            callback(err);
        }
    })
}

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////// system load  ///////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

function loadavg(callback){
    const value = {};
    value['loadavg'] = os.loadavg();
    let number_core = os.cpus().length;
    value['loadavg_per_core'] = [value['loadavg'][0] / number_core, value['loadavg'][1] / number_core, value['loadavg'][2] / number_core];
    value['timestamp'] = Date.now();
    callback(null, value);
}
/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Overall ///////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
function overall(period, callback){
    /* For MacOS testing
    let data = {
		"loadavg":[1,1,1],
		"corenum":4,
		"cpuuser":0.2,
		"cpusys":0.2,
		"memtotal":2319231430,
		"memfree":343425233,
		"memavail":2343432,
		"disk":[
			{
				"name":"sdb",
				"write":343,
				"read":2434
			},{
				"name":"sda",
				"write":34,
				"read":434
			}
		]
    };
    setTimeout(()=>{
        callback({
            success: true,
            reasons:[],
            value: data
        });
    }, period);
    return;*/
    if(typeof period === 'function'){
        callback = period;
        period = 1000;
    }
    let final_result={};
    
    async.parallel([
        (callback_)=>{
            CPU(period, (err, result)=>{
                if(result){
                    final_result["CPU"] = result;
                }
               
                callback_();
            });
        },
        (callback_)=>{
            memory((err, result)=>{
                if(result){
                    final_result["memory"]=result;
                }
                
                callback_();
            });
        },
        (callback_)=>{
            loadavg((err, result)=>{
                if(result){
                    final_result["loadavg"]=result;
                   
                }
                callback_();
            })
        },
        (callback_)=>{
            networkIO(period, (err, result)=>{
                if(result){
                    final_result["networkIO"]=result;
                }
                callback_();
            })
        },
        (callback_)=>{
            diskIO(period, (err, result)=>{
                if(result){
                    final_result["diskIO"]=result;
                }
                callback_();
            })
        }
    ],()=>{

        final_result['timestamp'] = Date.now();
        let new_result = {};
        new_result.loadavg = final_result.loadavg.loadavg;
        new_result.corenum = final_result.CPU.corenum;
        new_result.cpuuser = final_result.CPU.overview.user;
        new_result.cpusys = final_result.CPU.overview.sys;
        new_result.memtotal = final_result.memory.MemTotal;
        new_result.memfree = final_result.memory.MemFree;
        new_result.memavail = final_result.memory.MemAvailable;
        new_result.disk = [];
        let disk_ = final_result.diskIO.disk_io;
        for(let i = 0; i < disk_.length; i++){
            if(disk_[i].name.length == 3 && disk_[i].name.substr(0,2) == "sd"){
                new_result.disk.push(disk_[i]);
            }
        }
        callback({
            success: true,
            reasons:[],
            value: new_result
        });
    });

}
module.exports.memory = memory;
module.exports.CPU = CPU;
module.exports.loadavg = loadavg;
module.exports.systeminfo = systeminfo;
module.exports.networkIO = networkIO;
module.exports.diskIO = diskIO;
module.exports.overall = overall;