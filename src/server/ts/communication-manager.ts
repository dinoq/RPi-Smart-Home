var wifi = require('node-wifi');
const os = require('os');
const net = require('net');
const coap = require('coap');
const dgram = require("dgram");
const Process = require("process");
const COnfig = require("../config.json");

module.exports = class CommunicationManager{
    constructor(){
        
        var coapTiming = {
            ackTimeout:0.25,
            ackRandomFactor: 1.0,
            maxRetransmit: 2,
            maxLatency: 2,
            piggybackReplyMs: 10
          };
        coap.updateTiming(coapTiming);    
    }

    public static getServerIP(){
        let networkInterfaces = os.networkInterfaces();        
        let addressesInfo = networkInterfaces["Wi-Fi"];
        for (let i=0; i<addressesInfo.length; i++) {
            let addrInfo = addressesInfo[i];
            if(!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }
    public async connectToESP() {

    }

    initCommunicationWithESP(){
        return new Promise( (resolve, reject) => {
            console.log('initCommunicationWithESP: ');
            const localIP = CommunicationManager.getServerIP();
           
            const socket = dgram.createSocket({ type: "udp4" });
            socket.addMembership(COnfig.COAP_MULTICAST_ADDR, localIP);

            const message = "RPi-server-IP:" + localIP;
            socket.send(message, 0, message.length, COnfig.COAP_PORT, COnfig.COAP_MULTICAST_ADDR, function() {
                console.info(`Sending message "${message}"`);
            });

            let espIP = null;
            socket.on("message", function(message, rinfo) {
                if(espIP)
                    return;
                espIP = rinfo.address;
                setTimeout(() => {resolve(espIP);}, 0)
            });

        })
    }

    public async sendESPItsID(id: string){
        //TODO
    }

    public async putVal(ip: string, pin: string, val: string){        
        let req = coap.request({
            host: ip,
            pathname: '/set-io',
            query: "pin=" + pin,
            method: "PUT",
            confirmable: true
        });

        req.write(val);
        req.on('error', function(err) { 
            console.log('e: ', err);

        })
        req.end();
        console.log("req end");
    }

    public async getVal(ip: string, pin: string){        
        let req = coap.request({
            host: ip,
            pathname: '/get-io',
            query: "pin=" + pin,
            method: "GET",
            confirmable: true
        });

        req.on('error', function(err) { 
            console.log('e: ', err);

        })
        req.on('response', function(res) {
            console.log('res: ', res.payload.toString());
            console.log("response");
          })
        req.end();
        console.log("req end");
    }
}
