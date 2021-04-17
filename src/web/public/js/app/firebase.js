import { ServerCommunicationErrorDialog } from "../components/dialogs/error-dialog.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";
export class Firebase extends Singleton {
    constructor() {
        super();
        this.loggedIn = false;
        this.uid = undefined;
        this._online = false;
        this._onlineValidTimeout = 1000;
        this._lastConnCheck = 0;
        this._paired = undefined; // Značka, zda je server spárovaný s uživatelským účtem
        this.localAccess = false; // Označuje, zda uživatel k webové aplikaci přistupuje z lokální sítě, nebo domény auto-home.web.app. Na základě toho buď webová aplikace komunikuje přímo s databází, nebo pouze se serverem (v případě komunikace v lokální síti), který později přeposílá do databáze data, pokud má server přístup k internetu
        this.localAccess = !(window.location.hostname.includes("auto-home.web.app"));
        if (this.localAccess) { // V případě lokální aplikace nechceme využívat firebase (v případě offline by navíc došlo k vyjímce)            
            this.serverCall("GET", "/paired", true).then(async (pairedObj) => {
                this._paired = (pairedObj && pairedObj.paired) ? true : false;
            }).catch((value) => {
                this._paired = false;
            });
        }
        else {
            this.authInited = new Promise((resolve, reject) => { this.resolveAuthInited = resolve; });
            this.database = firebase.database();
            this.auth = firebase.auth();
            //console.log("firebase|" + (16179879960 - Math.round(new Date().getTime() / 100)));
            this.auth.onAuthStateChanged((user) => {
                //console.log("Až ted|" + (16179879960 - Math.round(new Date().getTime() / 100)));
                this.resolveAuthInited(user);
                if (user) {
                    this.loggedIn = true;
                    this.uid = user.uid;
                }
                else {
                    this.loggedIn = false;
                    this.uid = null;
                    this.auth.signOut();
                }
            });
        }
    }
    static get paired() {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            if (fb._paired == undefined) {
                return this.serverCall("GET", "/paired").then(async (value) => {
                    fb._paired = (value == "true");
                }).catch((value) => {
                    fb._paired = false;
                }).then((value) => {
                    return fb._paired;
                });
            }
            else {
                return Promise.resolve(fb._paired);
            }
        }
        else {
            return Promise.resolve(false);
        }
    }
    static get localAccess() {
        return Firebase.getInstance().localAccess;
    }
    static getInstance() {
        return super.getInstance();
    }
    static login(username, pwd, persistence = AuthPersistence.LOCAL) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
        }
        else {
            return new Promise((resolve, reject) => {
                fb.auth.setPersistence(persistence)
                    .then(() => {
                    fb.auth.signInWithEmailAndPassword(username, pwd)
                        .then((user) => {
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
                    console.log("Chyba: " + errorMessage);
                });
            });
        }
    }
    static register(username, pwd) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
        }
        else {
            return new Promise((resolve, reject) => {
                fb.auth.createUserWithEmailAndPassword(username, pwd)
                    .then((userCredential) => {
                    console.log('userCredential: ', userCredential);
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
            });
        }
    }
    static async logout() {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
        }
        else {
            fb.loggedIn = false;
            fb.uid = null;
            await fb.auth.signOut();
        }
    }
    static async loggedIn() {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
            return true;
        }
        else {
            await fb.authInited;
            return fb.loggedIn;
        }
    }
    static async getFullPath(dbPath) {
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let slash = (path.lastIndexOf("/") == path.length - 1) ? "" : "/";
        path += slash;
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
            return path;
        }
        else {
            await fb.authInited;
            path = fb.uid + path;
            return path;
        }
    }
    static async serverCall(method, url) {
        let fb = Firebase.getInstance();
        return fb.serverCall(method, url);
    }
    async serverCall(method, url, getAsJSON = false) {
        let res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "text/plain" }
        });
        if (getAsJSON) {
            return await res.json();
        }
        return await res.text();
    }
    static async addDBListener(dbPath, callback) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            console.warn("TODO");
            let source;
            try {
                source = new EventSource('/addDBListener?path=' + dbPath);
                let messageHandler = (e) => {
                    callback(JSON.parse(e.data));
                };
                let errorHandler = (e) => {
                    fetch("alive", {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" }
                    }).then((resp) => {
                        if (!resp) {
                            new ServerCommunicationErrorDialog();
                            source.close();
                        }
                    }).catch((err) => {
                        new ServerCommunicationErrorDialog();
                        source.close();
                    });
                };
                source.addEventListener('message', messageHandler);
                source.addEventListener('error', errorHandler);
                let off = () => {
                    console.log("OFF path: " + dbPath);
                    source.removeEventListener('message', messageHandler);
                    source.removeEventListener('error', errorHandler);
                    source.close();
                };
                return { off: off };
            }
            catch (error) {
                new ServerCommunicationErrorDialog();
                source.close();
            }
        }
        else {
            let dbReference = fb.database.ref(await Firebase.getFullPath(dbPath));
            dbReference.on('value', (snapshot) => {
                const data = snapshot.val();
                callback(data);
            });
            return dbReference;
        }
    }
    static async getDBData(dbPath) {
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
            }
            catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        }
        else {
            let fullPath = await Firebase.getFullPath(dbPath);
            try {
                let snapshot = await fb.database.ref(fullPath).once('value');
                return snapshot.val();
            }
            catch (error) {
                throw new Error("Error in Firebase.getDBData()");
            }
        }
    }
    static async updateDBData(dbPath, updates) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("updateData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath, data: updates })
                });
            }
            catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        }
        else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() });
                return await fb.database.ref(fullPath).update(updates);
            }
        }
    }
    static async deleteDBData(dbPath) {
        let fb = Firebase.getInstance();
        if (fb.localAccess) {
            try {
                let resp = await fetch("deleteData", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: dbPath })
                });
                return resp;
            }
            catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        }
        else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(fullPath).remove();
                return (await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() }));
            }
        }
    }
    static async pushNewDBData(dbPath, data) {
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
            }
            catch (error) {
                new ServerCommunicationErrorDialog();
                return null;
            }
        }
        else {
            let fullPath = await Firebase.getFullPath(dbPath);
            let lastTimePath = await Firebase.getFullPath("/");
            lastTimePath = lastTimePath.substring(0, lastTimePath.length - 1);
            if (await fb.online) {
                await fb.database.ref(lastTimePath).update({ lastWriteTime: Date.now() });
                return await fb.database.ref().child(fullPath).push(data);
            }
        }
    }
    get online() {
        return this.checkConnection();
    }
    async checkConnection() {
        if ((this._lastConnCheck + this._onlineValidTimeout) > Date.now()) { // internet connection state is "cached"
            //console.log("Cached!");
            return this._online;
        }
        else {
            //console.log("not Cached!");
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
                    });
                });
                if (success) { // successfully fetched
                    this._lastConnCheck = Date.now();
                    this._online = true;
                    return this._online;
                }
            }
            catch (error) {
                console.log('Chyba při kontrole připojení k internetu: ', error);
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
};
