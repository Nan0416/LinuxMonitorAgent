const CPU = require('./monitor_functions').CPU;
const memory = require('./monitor_functions').memory;

/*setInterval(()=>{
    CPU(100, (err, data)=>{
        console.log((data.overview.user + data.overview.sys) * 100);
    });
},200)*/
setInterval(()=>{
    memory((err, data)=>{
        console.log(data.MemTotal / 1024 / 1024)
        console.log(data.MemFree / 1024 / 1024)
        console.log(data.SwapTotal / 1024 / 1024)
        console.log(data.SwapFree / 1024 / 1024)
    })
}, 1000)
