var wifi = require('node-wifi');
const os = require('os');
const net = require('net');
const coap = require('coap');
const dgram = require("dgram");
const Process = require("process");
const COnfig = require("../config.json");
module.exports = class CommunicationManager {
    constructor() {
        var coapTiming = {
            ackTimeout: 0.25,
            ackRandomFactor: 1.0,
            maxRetransmit: 2,
            maxLatency: 2,
            piggybackReplyMs: 10
        };
        coap.updateTiming(coapTiming);
    }
    static getServerIP() {
        let networkInterfaces = os.networkInterfaces();
        let addressesInfo = networkInterfaces["Wi-Fi"];
        for (let i = 0; i < addressesInfo.length; i++) {
            let addrInfo = addressesInfo[i];
            if (!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }
    async connectToESP() {
    }
    initCommunicationWithESP() {
        return new Promise((resolve, reject) => {
            console.log('initCommunicationWithESP: ');
            const localIP = CommunicationManager.getServerIP();
            /*
            const socket = dgram.createSocket({ type: "udp4" });
            socket.addMembership(COnfig.COAP_MULTICAST_ADDR, localIP);
            function sendMessage() {
                const message = localIP;
                socket.send(message, 0, message.length, COnfig.COAP_PORT, COnfig.COAP_MULTICAST_ADDR, function() {
                    console.info(`Sending message "${message}"`);
                });
            }
            sendMessage();
            let espIP = null;
            socket.on("message", function(message, rinfo) {
                if(espIP)
                    return;
                espIP = rinfo.address;
                setTimeout(() => {resolve(espIP);}, 0)
            });*/
            let req = coap.request({
                host: COnfig.COAP_MULTICAST_ADDR,
                pathname: '/getip',
                //method: "PUT",
                confirmable: false,
                multicast: true
            });
            req.write(localIP);
            req.on('error', function (err) {
                console.log('e: ', err);
            });
            req.end();
            console.log("req end");
        });
    }
    async sendESPItsID(id) {
        //TODO
    }
    async putVal(ip = "224.0.1.187", pin = "D0") {
        let req = coap.request({
            host: ip,
            pathname: '/io',
            query: "pin=" + pin,
            //method: "PUT",
            confirmable: true
        });
        req.write(JSON.stringify({
            title: 'this is a test payload',
            body: 'containing nothing useful'
        }));
        req.on('error', function (err) {
            console.log('e: ', err);
        });
        req.end();
        console.log("req end");
    }
};
