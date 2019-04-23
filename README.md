An agent is a component that runs on the monitored linux machine. Different agents can gather metrics and information for different purpose. This agent is a commmon system performance agent that gathers a varity of system metrics and sends to the server.


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
