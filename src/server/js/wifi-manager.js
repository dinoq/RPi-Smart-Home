var wifi = require('node-wifi');
const CommunicationManager = require('./communication-manager.js');
const Config = require('../config.json');
module.exports = class WifiManager {
    constructor() {
    }
    async initCommunicationWithESP() {
        //let espIP: string = null;
        while (!(await this.scanForModuleAndConnect())) {
            await (new Promise((resolve, reject) => setTimeout(resolve, 10000)));
            console.log("repeating...");
        }
        //Získat ještě tady nějak IP adresu esp?? Asi jo...
    }
    async scanForModuleAndConnect() {
        // Initialize wifi module
        // Absolutely necessary even to set interface to null
        wifi.init({
            iface: null // network interface, choose a random wifi interface if set to null
        });
        let SSIDs = await this._scanSSIDAsync();
        console.log('SSIDs: ', SSIDs);
        let index = SSIDs.findIndex((ssid) => {
            return ssid.includes(Config.ESP_SSID_PREFIX);
        });
        if (index == -1)
            return null;
        //Connect to ESP
        try {
            await this._connectToEspApAync(SSIDs[index], Config.ESP_AP_PWD);
            //Následně se připojit přes TCP k ESP (které bude naslouchat na předem definované adrese z configu) a předat mu IP adresu serveru...IP esp nebude potřeba, získá se potom od esp které bude znat ip serveru a připojí se k němu....
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    // Promisifying functions...
    _scanSSIDAsync() {
        return new Promise((resolve, reject) => {
            wifi.scan((error, networks) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(networks.map((w) => {
                        return w.ssid;
                    }));
                    /*
                        networks = [
                            {
                            ssid: '...',
                            bssid: '...',
                            mac: '...', // equals to bssid (for retrocompatibility)
                            channel: <number>,
                            frequency: <number>, // in MHz
                            signal_level: <number>, // in dB
                            quality: <number>, // same as signal level but in %
                            security: 'WPA WPA2' // format depending on locale for open networks in Windows
                            security_flags: '...' // encryption protocols (format currently depending of the OS)
                            mode: '...' // network mode like Infra (format currently depending of the OS)
                            },
                            ...
                        ];
                        */
                }
            });
        });
    }
    _connectToEspApAync(SSID, pwd) {
        return new Promise((resolve, reject) => {
            wifi.connect({ ssid: SSID, password: pwd }, error => {
                if (error) {
                    reject(error);
                }
                resolve(null);
            });
        });
    }
};
