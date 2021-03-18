var wifi = require('node-wifi');
const os = require('os');
const net = require('net');
const coap = require('coap');
const dgram = require("dgram");
const Process = require("process");
const COnfig = require("../config.json");
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
        let addressesInfo = networkInterfaces["Wi-Fi"];
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

            const message = "RPi-server-IP:" + localIP;
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
    }

    public async sendESPItsID(ip:string, id: string) {
        this.coapRequest(ip, "/set-id", "", "PUT", id, null, (err) => {
            // module didnt recieve its new ID
            console.log("Module didnt recieve its new ID");
        }, false);
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

    public listenTo(ip: string, input: string) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/listen-to", "input=" + input, "GET", null, (res) =>{
                /*const prefixLen = "ESP-get-val:".length;
                const val = res.payload.toString().substring(prefixLen);
                */
                console.log("res"+res.payload.toString());
                resolve(res.payload.toString());
            }, (err)=> {
                console.log('No reply in 5s from ' + ip);
                reject(err);
            });
        })
    }

    public async resetRPiServer(ip: string) {
        this.coapRequest(ip, "/reset-module", "", "DELETE", null, null, null, false);
    }

}
/*
class SensorInfo
{
    IN; //Pin number or I2C_IN_TYPE
    val_type; // ANALOG/DIGITAL/I2C
    val;

    SensorInfo(IN: IN_TYPE, val_type: VALUE_TYPE, val: number){
        this.IN = IN;
        this.val_type = val_type;
        this.val = val;
    }

    //returns input in database format
    public getInput(){
        let analog = this.val_type == VALUE_TYPE.ANALOG;
        let digital = this.val_type == VALUE_TYPE.DIGITAL;
        let i2c = this.val_type == VALUE_TYPE.I2C;

        let str = "";
        if(analog || digital){
            str = (analog)? "A" : "D";
            str += this.IN;
        }else if(i2c){
            if(this.IN < IN_TYPE.BMP280_TEMP){

            }else{ // I2C
                let type = SensorInfo.IN_TYPE_TO_STR[this.IN];
                if(type != undefined)
                    str = "I2C-" + type;
            }

        }
        return str;
    }

    static IN_TYPE_TO_STR = {}; // definition at end of page

};

/*
// From esp.h:
enum VALUE_TYPE
{
    ANALOG = 1, // Start from 1, because we add it to string and we don't want to consider it as null terminator
    DIGITAL,
    I2C
};
enum IN_TYPE
{

    //I2C
    BMP280_TEMP = 20, //from 0 are pin numbers...
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM,

};
*/

