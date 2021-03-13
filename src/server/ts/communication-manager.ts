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

    public static getServerIP() {
        let networkInterfaces = os.networkInterfaces();
        let addressesInfo = networkInterfaces["Wi-Fi"];
        for (let i = 0; i < addressesInfo.length; i++) {
            let addrInfo = addressesInfo[i];
            if (!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }
    public async connectToESP() {

    }

    initCommunicationWithESP() {
        return new Promise((resolve, reject) => {
            console.log('initCommunicationWithESP: ');
            const localIP = CommunicationManager.getServerIP();

            const socket = dgram.createSocket({ type: "udp4" });
            socket.addMembership(COnfig.COAP_MULTICAST_ADDR, localIP);

            const message = "RPi-server-IP:" + localIP;
            socket.send(message, 0, message.length, COnfig.COAP_PORT, COnfig.COAP_MULTICAST_ADDR, function () {
                console.info(`Sending message "${message}"`);
            });

            let espIP = null;
            socket.on("message", function (message, rinfo) {
                if (espIP)
                    return;
                espIP = rinfo.address;
                setTimeout(() => { resolve({ IP: espIP, boardType: message.toString() }); }, 0)
            });

        })
    }

    private coapRequest(ip: string, pathname: string, query: string, method: string, 
        valToWrite: null | string, onResponse: any, onError: any, confirmable: boolean = true) {
        let req = coap.request({
            host: ip,
            pathname: pathname,
            query: query,
            method: method,
            confirmable: true
        });

        if (valToWrite != null)
            req.write(valToWrite);


        req.on('error', (err) => {
            if (onError)
                onError(err);
        })

        req.on('response', (res) => {
            if (onResponse)
                onResponse(res);
        })

        req.end();
        console.log("req end");
    }

    public async sendESPItsID(ip:string, id: string) {
        this.coapRequest(ip, "/set-id", "", "PUT", id, null, null, false);
    }

    public async putVal(ip: string, pin: string, val: string) {
        this.coapRequest(ip, "/set-io", "pin=" + pin, "PUT", val, null, null);
    }

    public getVal(ip: string, input: string) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/get-io", "input=" + input, "GET", null, (res) =>{
                const prefixLen = "ESP-get-val:".length;
                const val = res.payload.toString().substring(prefixLen);
                resolve(val);
            }, (err)=> {
                console.log('No reply in 5s from ' + ip);
                reject(err);
            });
        })
    }

    public async resetRPiServer(ip: string) {
        this.coapRequest(ip, "/reset-RPi-server", "", "DELETE", null, null, null, false);
    }

    
}
