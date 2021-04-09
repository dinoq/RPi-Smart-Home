const os = require('os');
const coap = require('coap');
const dgram = require("dgram");
const editJsonFile = require("edit-json-file");
module.exports = class CommunicationManager {
    constructor() {
        this._config = editJsonFile("config.json", {
            autosave: true
        });
        var coapTiming = {
            ackTimeout: 0.25,
            ackRandomFactor: 1.0,
            maxRetransmit: 2,
            maxLatency: 3,
            piggybackReplyMs: 10
        };
        coap.updateTiming(coapTiming);
    }
    static getServerIP() {
        let networkInterfaces = os.networkInterfaces();
        let addressesInfo = networkInterfaces["Wi-Fi"]; // Wi-Fi on Windows, wlan0 on Ubuntu/Raspbian
        for (let i = 0; i < addressesInfo.length; i++) {
            let addrInfo = addressesInfo[i];
            if (!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }
    initCoapServer(CoAPIncomingMsgCallback) {
        //init multicast listening
        const localIP = CommunicationManager.getServerIP();
        const socket = dgram.createSocket({ type: "udp4" });
        socket.addMembership("224.0.1.187", localIP);
        this._server = coap.createServer();
        this._server.on('request', function (req, res) {
            CoAPIncomingMsgCallback(req, res);
        });
        this._server.listen(function () {
        });
    }
    initCommunicationWithESP() {
        return new Promise((resolve, reject) => {
            console.log('initCommunicationWithESP: ');
            this.coapRequest("224.0.1.187", "/hello-client", "", "GET", null, (response) => {
                resolve({ espIP: response.rsinfo.address, boardType: response.payload.toString().substring("TYPE:".length) });
            }, (err) => {
                reject(err.message);
            });
        });
    }
    coapRequest(ip, pathname, query, method, valToWrite, onResponse, onError, confirmable = true, multicast = false) {
        let params = {
            host: ip,
            pathname: pathname,
            query: query,
            method: method,
            confirmable: confirmable,
            multicast: multicast
        };
        if (multicast)
            params.multicastTimeout = 5000;
        let req = coap.request(params);
        if (valToWrite != null)
            req.write(valToWrite);
        const errStack = new Error().stack;
        req.on('error', (err) => {
            if (onError)
                onError(err);
        });
        req.on('response', (res) => {
            if (onResponse)
                onResponse(res);
        });
        req.end();
    }
    coapRequestAsync(ip, pathname, query, method, valToWrite, confirmable = true) {
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
            });
            req.on('response', (res) => {
                resolve(res);
            });
            req.end();
        });
    }
    async sendESPItsID(ip, id) {
        this.coapRequest(ip, "/set-id", "", "PUT", id, null, (err) => {
            // module didnt recieve its new ID
            console.error("Module didnt recieve its new ID");
        }, true);
    }
    /**
     *
     * @param ip IP address of module
     * @param output Output, eg. A2, D5... (first analog/digital, then GPIO number)
     * @param val Value to set
     */
    async putVal(ip, output, val) {
        //console.log("T putVal1: " + Math.round(Date.now() / 100));
        this.coapRequest(ip, "/set-output", "pin=" + output, "PUT", val.toString(), null, null);
        //console.log("T putVal 2: " + Math.round(Date.now() / 100));
    }
    /**
     * Function send to module rquisition for observation of specified input.
     * @param ip IP address of module
     * @param input Input which server want to observe. Eg. A17, D13, I2C-BMP280-teplota...
     * @returns Promise, which resolve when CoAP response received (or reject on error)
     */
    ObserveInput(ip, input) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/observe-input", "input=" + input, "PUT", null, (res) => {
                resolve(res.payload.toString());
            }, (err) => {
                console.error("ObserveInput err: " + err.message + " from " + ip);
                reject(err.message);
            }, true);
        });
    }
    stopInputObservation(ip, input) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/stop-input-observation", "input=" + input, "PUT", null, (res) => {
                resolve(res.payload.toString());
            }, (err) => {
                reject(err.message);
            }, true);
        });
    }
    async changeObservedInput(ip, oldInput, newInput) {
        try {
            await this.coapRequestAsync(ip, "/change-observed-input", "old=" + oldInput + "&new=" + newInput, "PUT", null, true);
        }
        catch (err) {
            console.error('changeObservedInput err: ', err.message);
        }
    }
    resetModule(ip) {
        this.coapRequest(ip, "/reset-module", "", "DELETE", null, null, null, true);
    }
    /**
     * Function send configuration of all inputs and outputs (from database). CoAP message query is in format something like "IN:A17|D13|I2C-BMP280-teplota&OUT:D3=1024|A8=250"
     * @param ip
     * @param IN
     * @param OUT
     */
    setAllIO(ip, InOut) {
        console.log('setAllIO: ', InOut);
        this.coapRequest(ip, "/set-all-IO-state", InOut, "PUT", null, null, (err) => {
            console.error('setAllIO err: ', err.message);
        }, false);
    }
};
