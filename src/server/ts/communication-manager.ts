const os = require('os');
const coap = require('coap');
const dgram = require("dgram");

export class CommunicationManager {
    private _server: any;
    constructor() { 

        //TODO upravit coapTiming
        //Nastavení časování CoAP zpráv
        var coapTiming = {
            ackTimeout: 0.25,
            ackRandomFactor: 1.0,
            maxRetransmit: 2,
            maxLatency: 3,
            piggybackReplyMs: 10
        };
        coap.updateTiming(coapTiming);
    }

    public static getAddressInfos(){
        let networkInterfaces = os.networkInterfaces();
        let wifiInterface = (os.platform() == "win32") ? "Wi-Fi" : "wlan0";
        let interfaceInfos = networkInterfaces[wifiInterface];
        interfaceInfos = (interfaceInfos)? interfaceInfos : [];
        return interfaceInfos; // Wi-Fi on Windows, wlan0 on Ubuntu/Raspbian
    }

    /**
     * Funkce vrací IP adresu serveru.
     * @returns IP adresu serveru.
     */
    public static getServerIP() {
        let addressInfos = CommunicationManager.getAddressInfos();
        for (let i = 0; i < addressInfos.length; i++) {
            let addrInfo = addressInfos[i];
            if (!addrInfo.internal && addrInfo.family == "IPv4" && addrInfo.address) {
                return addrInfo.address;
            }
        }
    }

    /**
     * Nainicializuje CoAP server, kterému klienti posílají CoAP zprávy např. pokud se změní hodnoty jejich snímačů.
     * @param CoAPIncomingMsgCallback Callback funkce, které se jako argument předá request od klienta.
     */
    public initCoapServer(CoAPIncomingMsgCallback){
        //init multicast listening
        const localIP = CommunicationManager.getServerIP();
        const socket = dgram.createSocket({ type: "udp4" });
        socket.addMembership("224.0.1.187", localIP);

        this._server = coap.createServer()
 
        this._server.on('request', function(req, res) {
            CoAPIncomingMsgCallback(req, res);
        })
        
        this._server.listen(function() {
            
        });

    }

    /**
     * Funkce naváže "prvnotní" komunikaci s ESP modulem. 
     * Pošle "hello-client" CoAP zprávu na "All CoAP Nodes" multicastovou skupinu, na které by měli nové ESP moduly naslouchat.
     * @returns Promise, který se resolvne při získání odpovědi od nového modulu (v ní modul posílá typ vývojové desky,o který se jedná), případně rejectne při chybě (např při timeoutu).
     */
    initCommunicationWithESP() {
        return new Promise((resolve, reject) => {
            console.log('initCommunicationWithESP: ');

            this.coapRequest("224.0.1.187", "/hello-client", "", "GET", null, (response)=>{
                resolve({ espIP: response.rsinfo.address, boardType: response.payload.toString().substring("TYPE:".length)});
            }, (err)=>{
                reject(err.message);
            });
        })
    }

    /**
     * Funkce pošle CoAP zprávu na CoAP server (na ESP modul).
     * @param ip IP adresa modulu.
     * @param pathname "cesta ke zdroji".
     * @param query Query (parametry).
     * @param method zvolená metoda (GET, POST...).
     * @param valToWrite Hodnota, kterou chceme poslat.
     * @param onResponse Callback funkce, která se zavolá při získání odpovědi od modulu (předává se ji získaná odpověď).
     * @param onError Callback funkce, která se zavolá při chybě (předává se ji vyvolaná chyba).
     * @param confirmable Rozhoduje, zda se zpráva posílá jako potvrditelná.
     * @param multicast Rozhoduje, zda se zpráva posílá multicastem.
     */
    private coapRequest(ip: string, pathname: string, query: string, method: string, 
        valToWrite: null | string, onResponse: any, onError: any, confirmable: boolean = true, multicast: boolean = false) {
        let params: any = {
            host: ip,
            pathname: pathname,
            query: query,
            method: method,
            confirmable: confirmable,
            multicast: multicast
        };
        if(multicast)
            params.multicastTimeout = 5000;
            
        let req = coap.request(params);

        if (valToWrite != null)
            req.write(valToWrite);

        const errStack = new Error().stack;
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

    /**
     * Funkce pošle CoAP zprávu na CoAP server (na ESP modul) a vrátí Promise, která se resolve při získání odpovědi, resp. rejectne při chybě.
     * @param ip IP adresa modulu.
     * @param pathname "Cesta ke zdroji"
     * @param query Query (parametry).
     * @param method zvolená metoda (GET, POST...).
     * @param valToWrite Hodnota, kterou chceme poslat.
     * @param confirmable Rozhoduje, zda se zpráva posílá jako potvrditelná.
     * @returns Promise, který se resolve při získání odpovědi, resp. rejectne při chybě.
     */
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

    /**
     * Funkce odešle CoAP zprávou ESP modulu jeho ID z databáze.
     * @param ip IP adresa modulu.
     * @param id Odesílané ID.
     */
    public async sendESPItsID(ip:string, id: string) {
        this.coapRequest(ip, "/set-id", "", "PUT", id, null, (err) => {
            // module didnt recieve its new ID
            console.error("Module didnt recieve its new ID");
        }, true);
    }


    /**
     * 
     * @param ip IP adresa moduli.
     * @param output Výstup, např. A2, D5... (Formát: A/D (analogový/digitální) + GPIO číslo).
     * @param val Hodnota, která se má na daném výstupu nastavit.
     */
    public async putVal(ip: string, output: string, val: string | number) {
        this.coapRequest(ip, "/set-output", "pin=" + output, "PUT", val.toString(), null, null);
    }

    /**
     * Funkce odešle modulu žádost o sledování specifikovaného vstupu
     * @param ip IP adresa modulu.
     * @param input Vstup, který server požaduje sledovat. Např. A17, D13, I2C-BMP280-teplota... (Formát: [A/D (analogový/digitální) + GPIO číslo] pro klasické GPIO, [I2C-NAZEV_SNIMACE-SLEDOVANA_VELICINA] pro i2c).
     * @returns Promise, který se resolve při získání odpovědi, resp. rejectne při chybě.
     */
    public ObserveInput(ip: string, input: string) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/observe-input", "input=" + input, "PUT", null, (res) =>{
                resolve(res.payload.toString());
            }, (err)=> {
                console.error("ObserveInput err: "+err.message+ " from " + ip);
                reject(err.message);
            }, true);
        });
    }
    
    /**
     * Funkce odešle modulu žádost o ZASTAVENÍ sledování specifikovaného vstupu.
     * @param ip IP adresa modulu.
     * @param input Vstup, který server požaduje sledovat. Např. A17, D13, I2C-BMP280-teplota... (Formát: [A/D (analogový/digitální) + GPIO číslo] pro klasické GPIO, [I2C-NAZEV_SNIMACE-SLEDOVANA_VELICINA] pro i2c).
     * @returns Promise, který se resolve při získání odpovědi, resp. rejectne při chybě.
     */
    public stopInputObservation(ip: string, input: string) {
        return new Promise((resolve, reject) => {
            this.coapRequest(ip, "/stop-input-observation", "input=" + input, "PUT", null, (res) =>{
                resolve(res.payload.toString());
            }, (err)=> {
                reject(err.message);
            }, true);
        });
    }

    /**
     * Funkce odešle modulu žádost o změnu vstupu, který modul již sleduje. Např. pokud uživatel ve webovém klientovi změní u snímače vstup z D2 na D5.
     * @param ip IP adresa modulu.
     * @param oldInput Starý vstup.
     * @param newInput Nový vstup.
     */
    public async changeObservedInput(ip: string, oldInput: string, newInput: string) {
        try {
            await this.coapRequestAsync(ip, "/change-observed-input", "old=" + oldInput + "&new=" + newInput, "PUT", null, true);        
        } catch (err) {
            console.error('changeObservedInput err: ', err.message);            
        }
    }

    /**
     * Funkce odešle modulu žádost o "resetování". Jde o odstranění modulu ze systému, takto resetovaný modul je připravený k přidání do systému jako "nový".
     * @param ip IP adresa modulu.
     */
    public resetModule(ip: string) {
        this.coapRequest(ip, "/reset-module", "", "DELETE", null, null, null, true);
    }

    /**
     * Funkce pošle modulu konfiguraci všech jeho již konfigurovaných vstupů a výstupů z databáze.
     * O tuto konfiguraci si modul sám "řekne" při svém startu, aby si korektně nastavil své výstupy a zjistil, které vstupy má sledovat. 
     * Parametry (Query) CoAP zprávy jsou ve formátu něco jako "IN:A17|D13|I2C-BMP280-teplota&OUT:D3=1024|A8=250".
     * @param ip IP adresa modulu.
     * @param InOut Konfigurace vstupů a výstupů daného modulu.
     */
    public setAllIO(ip: string, InOut: string){
        console.log('setAllIO: ', InOut);
        this.coapRequest(ip, "/set-all-IO-state", InOut, "PUT", null, null, (err)=>{
            console.error('setAllIO err: ', err.message);
        }, false);

    }
}
