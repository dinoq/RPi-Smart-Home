var wifi = require('node-wifi');
const os = require('os');
const net = require('net');
const coap = require('coap');
const dgram = require("dgram");
const Process = require("process");
const COnfig = require("../config.js");
const ESP = require("./ESP");
const VALUE_TYPE = ESP.VALUE_TYPE;
const SensorInfo = ESP.SInfo;

module.exports = class CommunicationManager {
    private _server: any;
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
        let addressesInfo = networkInterfaces["Wi-Fi"]; // Wi-Fi on Windows, wlan0 on Ubuntu/Raspbian
        for (let i = 0; i < addressesInfo.length; i++) {
            let addrInfo = addressesInfo[i];
            if (!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }

    public initCoapServer(updateSensorCallback){
        this._server = coap.createServer()
 
        this._server.on('request', function(req, res) {
            //console.log('coap request');
            let val_type = req.payload[req.payload.length-2];
            let valStr = req.payload.toString().substring("in:".length, req.payload.length-2);
            let val;
            if(val_type == VALUE_TYPE.I2C){
                val = Number.parseFloat(valStr);
            } else{
                val = Number.parseInt(valStr);
            }
            let IN = Number.parseInt(req.payload[req.payload.length-1]) - 1; // We must substract 1, because we add it before sending in ESP8266 module (we want start from 1 due to problems with null terminator)
            updateSensorCallback(new SensorInfo(IN, val_type, val), req.rsinfo.address);
        })
        
        this._server.listen(function() {
            console.log("listening on default port");
        });

    }

    initCommunicationWithESP() {
        return new Promise((resolve, reject) => {
            console.log('initCommunicationWithESP: ');
            const localIP = CommunicationManager.getServerIP();

            const socket = dgram.createSocket({ type: "udp4" });
            socket.addMembership(COnfig.COAP_MULTICAST_ADDR, localIP);

            const message = "HELLO-CLIENT";
            socket.send(message, 0, message.length, COnfig.COAP_PORT, COnfig.COAP_MULTICAST_ADDR, function () {
                console.info(`Sending message "${message}"`);
            });

            let espIP = null;
            socket.on("message", function (message, rinfo) {
                if (espIP)
                    return;
                espIP = rinfo.address;
                setTimeout(() => { resolve({ espIP: espIP, boardType: message.toString().substring("TYPE:".length) }); }, 0)
            });
            setTimeout(() => { // time limit for any ESP to respond... If no ESP has been founded, it should be removed from DB
                reject("No module founded!");
            }, COnfig.NEW_MODULE_FIND_TIMEOUT);

        })
    }

    private coapRequest(ip: string, pathname: string, query: string, method: string, 
        valToWrite: null | string, onResponse: any, onError: any, confirmable: boolean = true) {
        let req = coap.request({
            host: ip,
            pathname: pathname,
            query: query,
            method: method,
            confirmable: confirmable
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
    }

    private coapRequestAsync(ip: string, pathname: string, query: string, method: string, 
        valToWrite: null | string, confirmable: boolean = true) {
        return new Promise((resolve, reject) => {
            let req = coap.request({
                host: ip,
                pathname: pathname,
                query: query,
                method: method,
                confirmable: confirmable
            });
    
            if (valToWrite != null)
                req.write(valToWrite);    
            
            req.on('error', (err) => {
                reject(err.message);
            })
    
            req.on('response', (res) => {
                resolve(res);
            })
    
            req.end();
        })
    }

    public async sendESPItsID(ip:string, id: string) {
        this.coapRequest(ip, "/set-id", "", "PUT", id, null, (err) => {
            // module didnt recieve its new ID
            console.log("Module didnt recieve its new ID");
        }, false);
    }

    public async putVal(ip: string, pin: string, val: string) {
        this.coapRequest(ip, "/set-output", "pin=" + pin, "PUT", val.toString(), null, null);
    }

    public ObserveInput(ip: string, input: string) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/observe-input", "input=" + input, "PUT", null, (res) =>{
                /*const prefixLen = "ESP-get-val:".length;
                const val = res.payload.toString().substring(prefixLen);
                */
                console.log("listen-to res"+res.payload.toString());
                resolve(res.payload.toString());
            }, (err)=> {
                console.log('No reply in 5s from ' + ip);
                reject(err);
            }, true);
        });
    }

    public async changeObservedInput(ip: string, oldInput: string, newInput: string) {
        try {
            await this.coapRequestAsync(ip, "/change-observed-input", "old=" + oldInput + "&new=" + newInput, "PUT", null, true);        
        } catch (err) {
            console.log('changeObservedInput err: ', err);            
        }
    }

    public async resetRPiServer(ip: string) {
        this.coapRequest(ip, "/reset-module", "", "DELETE", null, null, null, false);
    }

}
