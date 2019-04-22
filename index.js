
join(options.name);
process.on('SIGINT', () => {
    console.log(`About to exit with code:`);
    leave(()=>{
        process.exit(0);
    });
});
