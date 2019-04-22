The agent is the component that runs on the monitored linux machine. It gathers a varity of system metrics and sends to the server.

private-api-key: 
RESTful API

POST /restapi/common
Body 
{
    api-key:...
    data:{
        cpu:{

        },
        memory:{

        },
    }
}
