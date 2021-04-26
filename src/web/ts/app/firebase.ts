import { ServerCommunicationErrorDialog } from "../components/dialogs/error-dialog.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";
import { Utils } from "./utils.js";

export declare var firebase: any;
export class Firebase extends Singleton {
    private loggedIn: boolean = false;
    database: any;
    auth: any;
    uid: any = undefined;
    authInited: Promise<any>;
    resolveAuthInited: any;

    _online: boolean = false;
    _onlineValidTimeout: number = 1000;
    _lastConnCheck: number = 0;

    _paired: boolean = undefined; // Značka, zda je server spárovaný s uživatelským účtem
    localAccess: boolean = false; // Označuje, zda uživatel k webové aplikaci přistupuje z lokální sítě, nebo domény auto-home.web.app. Na základě toho buď webová aplikace komunikuje přímo s databází, nebo pouze se serverem (v případě komunikace v lokální síti), který později přeposílá do databáze data, pokud má server přístup k internetu
    constructor() {
        super();
        this.localAccess = !(window.location.hostname.includes("auto-home.web.app"));

        if (this.localAccess) { // V případě lokální aplikace nechceme využívat firebase (v případě offline by navíc došlo k vyjímce)            
            this.serverCall("GET", "/paired", true).then(async (pairedObj) => {
                this._paired = (pairedObj && pairedObj.paired) ? true : false;
            }).catch((value) => {
                this._paired = false;
            })
        } else {
            this.authInited = new Promise((resolve, reject) => { this.resolveAuthInited = resolve; });

            this.database = firebase.database();
            this.auth = firebase.auth();
            this.auth.onAuthStateChanged((user) => {
                this.resolveAuthInited(user);
                if (user) {
                    this.loggedIn = true;
                    this.uid = user.uid;
                } else {
                    this.loggedIn = false;
                    this.uid = null;
                    this.auth.signOut();
                }
            });
        }
    }

    public static get paired(): Promise<boolean> {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            if (fb._paired == undefined) {
                return fb.serverCall("GET", "/paired", true).then(async (pairedObj) => {
                    fb._paired = pairedObj.paired;
                }).catch((value) => {
                    fb._paired = false;
                }).then((value) => {
                    return fb._paired;
                })
            } else {
                return Promise.resolve(fb._paired);
            }
        } else {
            return Promise.resolve(false);
        }
    }

    public static get localAccess() {
        return Firebase.getInstance().localAccess;
    }

    public static getInstance() {
        return <Firebase>super.getInstance();
    }

    static login(username, pwd, persistence: string = AuthPersistence.LOCAL) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            //V lokální síti se nepřihlašuje pomocí této funkce...
        } else {
            return new Promise((resolve, reject) => {
                fb.auth.setPersistence(persistence)
                    .then(() => {
                        fb.auth.signInWithEmailAndPassword(username, pwd)
                            .then((user: any) => {
                                fb.uid = user.uid;
                                fb.loggedIn = true;
                                resolve(user);

                            }).catch((error) => {
                                fb.uid = undefined;
                                fb.loggedIn = false;
                                reject(error);
                            });

                    })
                    .catch((error) => {
                        fb.uid = undefined;
                        fb.loggedIn = false;
                        reject(error);
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        console.error("Chyba: " + errorMessage);
                    });

            })
        }
    }

    static register(username, pwd) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            //V lokální síti se neregistruje pomocí této funkce...
        } else {
            return new Promise((resolve, reject) => {
                fb.auth.createUserWithEmailAndPassword(username, pwd)
                    .then((userCredential: any) => {
                        fb.uid = userCredential.user.uid;
                        fb.loggedIn = true;
                        resolve(userCredential);

                    }).catch((error) => {
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        fb.uid = undefined;
                        fb.loggedIn = false;
                        reject(error);
                    });
            })
        }
    }

    static async logout() {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            //V lokální síti se neodhlašuje pomocí této funkce...
        } else {
            fb.loggedIn = false;
            fb.uid = null;
            await fb.auth.signOut();
        }
    }

    static async loggedIn() {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            return true;
        } else {
            await fb.authInited;
            return fb.loggedIn;
        }
    }

    static async getFullPath(dbPath: string) {//Adds uid/ at start of dbPath parameter
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let slash = (path.lastIndexOf("/") == path.length - 1) ? "" : "/";
        path += slash;
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            return path;
        } else {
            await fb.authInited;
            path = fb.uid + path;
            return path;
        }
    }
    public static async serverCall(method: string, url: string) {
        let fb = Firebase.getInstance();
        return fb.serverCall(method, url);
    }

    public async serverCall(method: string, url: string, getAsJSON: boolean = false) {
        let res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "text/plain" }
        })

        if (getAsJSON) {
            return await res.json();
        }
        return await res.text();
    }

    static async addDBListener(dbPath: string, callback) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            let source;
            try {
                source = new EventSource('/addDBListener?path=' + dbPath)

                let messageHandler = (e)=> {
                    callback(JSON.parse(e.data));
                }

                let errorHandler = (e: any)=> { // Došlo k chybě, zkontroluje se, zda funguje spojení mezi klientem a serverem                    
                    fetch("alive", {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" }
                    }).then((resp) => {
                        if(!resp){
                            new ServerCommunicationErrorDialog();
                            source.close();
                        }                        
                    }).catch((err)=>{
                        new ServerCommunicationErrorDialog();
                        source.close();
                    })
                }

                source.addEventListener('message', messageHandler);
                source.addEventListener('error',  errorHandler)
                let off = ()=>{
                    source.removeEventListener('message', messageHandler);
                    source.removeEventListener('error',  errorHandler)
                    source.close();
                }

                return {off: off}
            } catch (error) {
                new ServerCommunicationErrorDialog();
                source.close();                
            }       
        } else {
            let dbReference = fb.database.ref(await Firebase.getFullPath(dbPath));
            dbReference.on('value', (snapshot) => {
                const data = snapshot.val();
                callback(data);
            });
            return dbReference;
        }
    }

    static async getDBData(dbPath: string): Promise<any> {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("getData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath })
                });
                let text = await resp.text();
                return (text.length) ? JSON.parse(text) : null;
            } catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        } else {
            let fullPath = await Firebase.getFullPath(dbPath);
            try {
                let snapshot = await fb.database.ref(fullPath).once('value');
                return snapshot.val();
            } catch (error) {
                throw new Error("Error in Firebase.getDBData()");
            }
        }
    }

    static async updateDBData(dbPath: string, updates: object) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("updateData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath, data: updates })
                });
            } catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        } else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() });
                return await fb.database.ref(fullPath).update(updates);
            }
        }
    }

    static async deleteDBData(dbPath: string): Promise<any> {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("deleteData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath })
                });
                return resp;
            } catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        } else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(fullPath).remove();
                return (await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() }));
            }
        }
    }

    static async pushNewDBData(dbPath: string, data: object): Promise<any> {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("pushData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath, data: data })
                });
                let text = await resp.text();
                return (text.length) ? { key: text } : { key: null };
            } catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        } else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() });
                return await fb.database.ref().child(fullPath).push(data);
            }
        }
    }


    public get online(): Promise<boolean> {
        return this.checkConnection();
    }

    public async checkConnection(): Promise<boolean> {
        if ((this._lastConnCheck + this._onlineValidTimeout) > Date.now()) { // internet connection state is "cached"
            return this._online;
        }
        let attemptCount;

        let fetchResolve;
        setTimeout(() => {
            attemptCount = Config.checkConnectionMaxAttempts;
            fetchResolve(false);
        }, Config.checkConnectionMaxTimeout);

        for (attemptCount = 0; attemptCount < Config.checkConnectionMaxAttempts; attemptCount++) {
            try {
                let success = await new Promise((resolve, reject) => {
                    fetchResolve = resolve;
                    fetch("https://ipv4.icanhazip.com/&time=" + Date.now())
                        .then((value) => {
                            resolve(true);
                        }).catch((value) => {
                            resolve(false);
                        })
                })
                if (success) { // successfully fetched
                    this._lastConnCheck = Date.now();
                    this._online = true;
                    return this._online;
                }
            } catch (error) {
                console.error('Chyba při kontrole připojení k internetu: ', error);
            }
        }
        this._lastConnCheck = Date.now();
        this._online = false;
        return this._online;
    }
}
export var AuthPersistence = {
    LOCAL: "local",
    SESSION: "session"
}

export interface DatabaseData{
    name?: string, // Název objektu, např. název místnosti
    dbID?: string, // Identifikátor objektu z databáze
    index?: number | string, // Index objektu v databázi, pokud je potřeba je řadit (např. místnosti na domovské stránce)
    path?: string, // Cesta k danému objektu, vč. vlastního identifikátoru
    parentPath?: string, // Cesta k danému objektu, BEZ vlastního identifikátoru (tedy o úroveň výš)
    type?: string,
    icon?: string, // Typ ikony pro snímače a zařízení (např. temp pro teploměr)
    input?: string, // Typ vstupu pro snímače, např D1
    output?: string, // Typ výstupu pro zařízení, např D1
    unit?: string, // U snímačů a zařízení typ (tzn. "analog"/"digital")
    IP?: string, // IP adresa (používá se u modulu)
    img?: {
        src: string, // URL k obrázku
        offset: number // Posun obrázku (v relativních hodnotách 0.0 až 1.0)
    },
    value?: number,//Hodnota, na snímači/výstupu

    expires?: number, // časová známka, která určuje, kdy daný časovač vyprší. Pokud je časovač neaktivní, je rovna -1
    time?: number, // Čas, po kterém dojde k timeoutu u časovače, pokud se znovu aktivuje
    valueToSet?: string | number, // Hodnota, jaká se po vypršení časovače nastaví na výstupu
    controlledOutput?: string, // Cesta k ovládanému výstupu
    watchedInput?: string; // Cesta ke snímači u automatizace na základě hodnoty snímače
    thresholdSign?: string,
    thresholdVal?: number,
    active?: boolean, // Pouze pro snímačové automatizace. Pro časovače se aktivnost vyhodnocuje na základě položky expires
}


export const DBTemplates = {
    get ROOMS(): DatabaseData {
        return {
            index: 0,
            img: {
                src: "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg",
                offset: 0
            },
            name: "Místnost " + Math.random().toString(36).substring(2, 6).toUpperCase()
        }
    },
    get MODULES(): DatabaseData {
        return {
            index: 0,
            /*in: {

            },
            out: {
            },*/
            name: "Modul " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            type: "wemosD1",
            IP: ""
        }
    },
    get SENSORS(): DatabaseData {
        return {
            type: "analog",
            index: 0,
            name: "Snímač " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            unit: "percentages",
            valueToSet: 0,
            input: "A17",
            icon: "temp"
        }
    },
    get DEVICES(): DatabaseData {
        return {
            index: 0,
            name: "Zařízení " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            output: "D1",
            type: "digital",
            valueToSet: 0,
            icon: "light"
        }
    },
    get TIMEOUT(): DatabaseData {
        let time = 60 * 1;
        return {
            name: "Časovač " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            type: "timeout",
            time: time, // Timeout v sekundách
            expires: -1, //Math.round(Date.now() / 1000) + time,
            controlledOutput: "", //např: "rooms/q4dF4zAHFXDZUL1xZK6d/devices/-MYvEMsIx3BHl7w_MvVa/OUT/-MYvEOxuCNPahisdrsm-",
            valueToSet: 500
        }
    },
    get SENSORS_AUTOMATIONS(): DatabaseData {
        return {
            name: "Automatizace " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            type: "automation",
            watchedInput: "",
            thresholdSign: ">",
            thresholdVal: 0,
            controlledOutput: "", //např: "rooms/q4dF4zAHFXDZUL1xZK6d/devices/-MYvEMsIx3BHl7w_MvVa/OUT/-MYvEOxuCNPahisdrsm-",
            valueToSet: 500,
            active: true
        }
    }
};