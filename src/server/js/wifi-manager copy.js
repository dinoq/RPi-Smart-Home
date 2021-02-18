var wifi = require('node-wifi');
export class WifiManager {
    constructor() {
    }
    async scanForModuleAndConnect(serverIP) {
        // Initialize wifi module
        // Absolutely necessary even to set interface to null
        wifi.init({
            iface: null // network interface, choose a random wifi interface if set to null
        });
        let SSIDs = await this._scanSSIDAsync();
        console.log('SSIDs: ', SSIDs);
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
}
