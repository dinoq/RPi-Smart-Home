
var wifi = require('node-wifi');
const os = require('os');
const net = require('net');

module.exports = class CommunicationManager{
    constructor(){
        
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
    public async connectToESP(serverIP: string) {

    }
}