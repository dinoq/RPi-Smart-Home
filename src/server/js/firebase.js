"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Firebase = void 0;
var firebase = require('firebase');
const fs = require("fs");
const isOnline = require('is-online');
const editJsonFile = require("edit-json-file");
const jsonManager = require("jsonfile");
const objectPath = require("object-path");
const merge = require('deepmerge');
const diff = require('deep-diff');
const path = require('path');
const ESP_js_1 = require("./ESP.js");
const communication_manager_js_1 = require("./communication-manager.js");
const config_reader_js_1 = require("./config-reader.js");
const error_logger_js_1 = require("./error-logger.js");
const dbFilePath = "local-database.json";
class Firebase {
    constructor() {
        this._firebaseInited = false; // Slouží pro informaci, zda byly již nainicializovány služby Firebase (v případě, že je server spuštěn bez přístupu k internetu, tak je nutné je po připojení k internetu nainicializovat)
        this._previousOnline = undefined;
        this._online = false;
        this._onlineValidTimeout = 5000;
        this._lastConnCheck = 0;
        this._loggedIn = false;
        this._sensorsUpdates = {};
        this._updateSensorsInDBTimeout = undefined;
        this._ignoredDBTimes = new Array(); // Obsahuje časy aktualizací z databáze, které jsou serverem ignorovány (protože změnu vyvolal sám, nechce tedy změny znovu zpracovávat)
        this.usedIPsByModules = new Array();
        this._firebaseHandlerActive = false; // Označuje, zda je aktivní posluchač události změny firebase databáze
        /**
         * Funkce je volána pravidelně, aby kontrolovala připojení k internetu a v případě ztráty (či opětovném) připojení provede dané akce...
         */
        this.connectionCheckInterval = async () => {
            let online = await this.online;
            //let fbInited = await this.firebaseInited;
            if (!this.loggedIn && online && this._loginInfo) { // Server je online, ale dosud nepřihlášený ve Firebase. Je to případ pokud se z nějakého důvodu nepodařilo přihlásit (ověřit) uživatele ve firebase (např. server v době spuštění nebyl online).
                await this.login(this._loginInfo.username, this._loginInfo.pwd); // Přihlásí uživatele
                if (this._previousOnline === false) {
                    console.log("Server opět v režimu online!");
                }
            }
            else if (this.loggedIn) { // Server buď je online, nebo alespoň už online byl a pak přešel do režimu offline
                let uid = this._fb.auth().currentUser.uid;
                if (!online && this._previousOnline) { // Stav se změnil z online na offline
                    console.log("Server přechází do režimu offline, až do připojení k internetu bude pracovat lokálně...");
                    this._firebaseHandlerActive = false;
                    this._fb.database().ref(uid).off(); // Je potřeba odstranit posluchače na změnu databáze
                }
                else if (online && !this._previousOnline && this._previousOnline != undefined) { //Stav se změnil z offline na online. Kontrola this._previousOnline != undefined je kvůli počáteční kontrole, při ní není žádané, aby se situace vyhodnotila jako přechod z offline do online
                    console.log("Server opět v režimu online!");
                    this.addFirebaseValueHandler();
                }
            }
            else { // Server je od svého spuštění offline
            }
            this._previousOnline = online;
            setTimeout(this.connectionCheckInterval, this._onlineValidTimeout);
        };
        /**
         * Funkce zpracuje přicházející CoAP zprávu (požadavek)
         * @param req Objekt požadavku
         * @param res Objekt odpovědi
         */
        this._CoAPIncomingMsgCallback = (req, res) => {
            if (req.url == "/new-value") { // Modul poslal novou hodnotu některého snímače
                let val_type = req.payload[req.payload.length - 2];
                let IN = Number.parseInt(req.payload[req.payload.length - 1]) - 1;
                let valStr = req.payload.toString().substring("in:".length, req.payload.length - 2);
                let val;
                if (valStr == "??") {
                    this._updateSensor(new ESP_js_1.SensorInfo(IN, val_type, valStr), req.rsinfo.address);
                }
                else {
                    if (val_type == ESP_js_1.VALUE_TYPE.I2C) {
                        val = Number.parseFloat(valStr).toFixed(1);
                    }
                    else {
                        val = Number.parseInt(valStr);
                    }
                    this._updateSensor(new ESP_js_1.SensorInfo(IN, val_type, val), req.rsinfo.address);
                }
            }
            else if (req.url == "/get-all-IO-state") { // Modul požaduje jeho konfiguraci IO (potřebuje ji po startu)
                const moduleIP = req.rsinfo.address;
                let IN = "";
                let OUT = "";
                let moduleFoundedInDB = false;
                const rooms = this.readFromLocalDB("rooms");
                for (const roomID in rooms) {
                    const room = rooms[roomID];
                    const modules = room["devices"];
                    for (const moduleID in modules) {
                        const module = modules[moduleID];
                        if (module.IP == moduleIP) { // If this module IP matches IP of modules from which message came, init IN and OUT.
                            moduleFoundedInDB = true;
                            const sensors = module["IN"];
                            for (const sensorID in sensors) {
                                IN = (IN) ? IN + "|" : "IN:";
                                IN += sensors[sensorID].input;
                            }
                            const devices = module["OUT"];
                            for (const deviceID in devices) {
                                let output = (devices[deviceID].type == "analog") ? "A" : "D"; //First convert val to rigt type (ANALOG/DIGITAL)
                                output += devices[deviceID].output.substring(1);
                                OUT = (OUT) ? OUT + "|" : "OUT:";
                                let val = devices[deviceID].value;
                                if (devices[deviceID].type == "analog") {
                                    if (val < 50) {
                                        val = 0;
                                        output = "D" + output.substring(1);
                                    }
                                    if (val > 950) {
                                        val = 1023;
                                        output = "D" + output.substring(1);
                                    }
                                }
                                OUT += output + "=" + val;
                            }
                        }
                    }
                }
                IN = (IN) ? IN : "IN:";
                OUT = (OUT) ? OUT : "OUT:";
                if (moduleFoundedInDB) {
                    this._communicationManager.setAllIO(moduleIP, IN + "&" + OUT);
                }
                else { // Module was probably deleted from database, when module was OFF => reset that module
                    this._communicationManager.resetModule(moduleIP);
                }
            }
            else if (req.url == "/report-error") {
                let ip = req.rsinfo.address;
                let moduleInfo = {};
                let db = this.readFromLocalDB("/");
                if (db && db["rooms"]) {
                    for (const roomID in db["rooms"]) {
                        let room = db["rooms"][roomID];
                        let modules = (room && room["devices"]) ? room["devices"] : undefined;
                        for (const moduleID in modules) {
                            let module = modules[moduleID];
                            if (module && module.IP) {
                                moduleInfo = module;
                            }
                        }
                    }
                }
                error_logger_js_1.ErrorLogger.log(null, {
                    errorDescription: "Přišla chyba z modulu: \n" + req.payload.toString(),
                    placeID: 28,
                    type: error_logger_js_1.ErrorTypes.MODULE_ERROR
                }, { infoOModulu: moduleInfo });
            }
            else {
                error_logger_js_1.ErrorLogger.log(null, {
                    errorDescription: "Modul poslal požadavek na serverem nezpracováváné URL!",
                    placeID: 27,
                    type: error_logger_js_1.ErrorTypes.WARNING
                });
            }
        };
        this._updateSensor = async (sensorInfo, moduleIP) => {
            let moduleFoundedInDB = false;
            this._getSensors().forEach((sensor, index, array) => {
                if (moduleIP == sensor.IP) {
                    moduleFoundedInDB = true;
                    if (sensorInfo.val != sensor.value
                        && sensorInfo.getInput() == sensor.input) { // If value changed and sensor input record exists in this_sensors, save change to DB
                        this._sensorsUpdates[sensor.pathToValue] = sensorInfo.val;
                        //sensor.value = sensorInfo.val;
                    }
                }
            });
            if (moduleFoundedInDB) {
                if (!this._updateSensorsInDBTimeout) {
                    this._updateSensorsInDBTimeout = setTimeout(this._updateSensorsInDB, 200);
                }
            }
            else { // Module was probably deleted from database, when module was OFF => reset that module
                this._communicationManager.resetModule(moduleIP);
            }
        };
        this._updateSensorsInDB = async () => {
            this._updateSensorsInDBTimeout = undefined;
            if (this._sensorsUpdates && Object.keys(this._sensorsUpdates).length != 0) {
                for (const updatePath in this._sensorsUpdates) { // Pro 
                    this._checkSensorAutomation(updatePath);
                }
                this.clientUpdateInDB({ path: "/", data: this._sensorsUpdates }, false);
                this._sensorsUpdates = {};
            }
        };
        this.clientDBListeners = new Array(); // Pole posluchačů (webových klientů) události změny databáze
        // Načtení lokální databáze
        this._loadLocalDBFromFile();
        this.getModulesIPs();
        // Vytvoření Promise, která se resolvne při přihlášení. Využívá se, pokud je někde potřeba čekat na přihlášení do Firebase.
        this._loggedInPromise = new Promise((resolve, reject) => { this._loggedInResolve = resolve; });
        this.online.then((online) => {
            if (online) {
                this.initFirebase();
            }
            else {
                console.log("Server je offline, až do připojení k internetu bude pracovat lokálně...");
            }
        });
        // Nastaví se timeout na kontrolu připojení k internetu. Ten se znovu nastavuje opět ve funkci this.connectionCheckInterval()
        setTimeout(this.connectionCheckInterval, this._onlineValidTimeout);
        this._communicationManager = new communication_manager_js_1.CommunicationManager();
        this._communicationManager.initCoapServer(this._CoAPIncomingMsgCallback);
        this.timeoutAutomations = new Array();
    }
    get loggedIn() {
        return this._loggedIn;
    }
    _loadLocalDBFromFile() {
        if (fs.existsSync(dbFilePath)) { // Pokud existuje soubor s lokální databází, načte se.
            try {
                this._dbFile = jsonManager.readFileSync(dbFilePath);
            }
            catch (error) {
                fs.writeFileSync(dbFilePath, '{}');
                this._dbFile = {};
                let fullPath = path.join(__dirname, '../' + dbFilePath);
                let reaction = (fs.existsSync(dbFilePath)) ? `Server vytvořil nový (prázdý) soubor ${fullPath}.` : "";
                error_logger_js_1.ErrorLogger.log(error, {
                    errorDescription: `Došlo k chybě při pokusu o načtení lokální databáze (souboru ${fullPath})!`,
                    placeID: 12,
                    reaction: reaction
                });
            }
        }
        else { // V opačném případě se vytvoří a nainicializuje na prázdný (JSON) objekt
            fs.writeFileSync(dbFilePath, '{}');
            this._dbFile = {};
        }
        if (typeof this._dbFile != "object") { // Kontrola, zda se načetl regulérní JSON objekt
            fs.writeFileSync(dbFilePath, '{}');
            this._dbFile = {};
        }
    }
    _setAutomationTimeoutIfActive(automation) {
        let oldTimeout = this.timeoutAutomations.find((a, index, array) => {
            return a.automationID == automation.dbID;
        });
        if (oldTimeout && oldTimeout.timeout) {
            clearTimeout(oldTimeout.timeout);
            this.timeoutAutomations.splice(this.timeoutAutomations.indexOf(oldTimeout));
        }
        if (automation.controlledOutput == undefined || automation.controlledOutput == ""
            || automation.type != "timeout" || automation.expires == -1) { // Pokud není zvolený žádný výstup/nejedná se o automatizaci typu timeout/nemá nastavenou expiraci (čas kdy vyprší), nemá smysl nastavovat nový timeout...
            return;
        }
        let actualTime = Math.round(Date.now() / 1000);
        let tolerationTime = 10;
        if (actualTime < automation.expires + tolerationTime) { // Pouze pokud timeout vypršel před méně než X(tolerationTime) vteřinami (zahrnuje se zde jistá "tolerance")...
            if (actualTime < automation.expires) { // K timeoutu ještě skutečně (zatím) nedošlo...
                let timeDiff = automation.expires - actualTime;
                let timeout = setTimeout(() => {
                    console.log("set because of timeout: ", automation.controlledOutput, ":::", automation.valueToSet);
                    this.clientUpdateInDB({ path: automation.controlledOutput, data: { value: automation.valueToSet } });
                    this.clientUpdateInDB({ path: "automations/" + automation.dbID, data: { expires: -1 } });
                    let thisTimeout = this.timeoutAutomations.find((a, index, array) => {
                        return a.automationID == automation.dbID;
                    });
                    this.timeoutAutomations.splice(this.timeoutAutomations.indexOf(thisTimeout));
                }, timeDiff * 1000);
                this.timeoutAutomations.push({
                    automationID: automation.dbID,
                    timeout: timeout
                });
            }
            else { //Timeout už vypršel, okamžitě  nastavit výstup
                console.log("set HNED because of timeout: ", automation.path, ":::", automation.valueToSet);
                this.clientUpdateInDB({ path: automation.controlledOutput, data: { value: automation.valueToSet } });
                this.clientUpdateInDB({ path: "automations/" + automation.dbID, data: { expires: -1 } });
            }
        }
    }
    /**
     * Funkce přidá serveru posluchače události změny hodnot v databázi (na nejvyšší úrovni, registruje tedy každou změnu v databázi pro daného uživatele)
     */
    async addFirebaseValueHandler() {
        if (this._firebaseHandlerActive) {
            return;
        }
        this._firebaseHandlerActive = true;
        let firstCycle = true;
        this._fb.database().ref(await this.userUID).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                //console.log("Aktualizace z Firebase databáze..." + ((data) ? data.lastWriteTime : data));
                this._firebaseDatabaseUpdateHandler(data, firstCycle);
                firstCycle = false;
            }
        });
    }
    /**
     * Vrací, zda jsou již služby firebase nainicializovány.
     * Zároveň pokud nejsou, tak se je pokusí nainicializovat a až pak vrací výsledek operace.
     * Je-li tedy nutné mít k něčemu tyto služby nainicializovány, postačí se dotázat na tuto vlastnost (firebaseInited)
     * a není třeba nejprve volat dsmotnout inicializaci...
     */
    get firebaseInited() {
        return this.online.then((online) => {
            if (online) {
                if (!this._firebaseInited) {
                    this.initFirebase();
                }
                return true;
            }
            else {
                return this._firebaseInited;
            }
        });
    }
    /**
     * Vrací unikátní ID uživatele z Firebase služeb.
     * Pokud nejsou služby nainicializovány a nic tomu nebrání, tak se nejprve nainicializují a až pak se vrátí UID.
     */
    get userUID() {
        return this.firebaseInited.then((firebaseInited) => {
            return this.online.then((online) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(null); }, 5000); // Ochrana před "zaseknutím" programu, pokud by čekal na získání userUID a _loggedInPromise se z nějakého důvodu "neresolvnul"
                    return this._loggedInPromise.then((value) => {
                        resolve(firebase.auth().currentUser.uid);
                    });
                });
            });
        });
    }
    /**
     * Funkce přihlásí uživatele přes autentizační server Firebase a přidá posluchače události změny hodnot ve Firebase databázi.
     * @param username Přihlašovací jméno (email)
     * @param pwd Heslo
     */
    async login(username, pwd) {
        this._loginInfo = { username: username, pwd: pwd };
        try {
            let inited = await this.firebaseInited;
            if (inited) {
                /*if (this.loggedIn) {
                    return;
                }*/
                try {
                    if (this._firebaseHandlerActive) {
                        let prevUID = await this.userUID;
                        this._firebaseHandlerActive = false;
                        this._fb.database().ref(prevUID).off(); // Je potřeba odstranit posluchače na změnu databáze
                    }
                    let user = await firebase.auth().signInWithEmailAndPassword(username, pwd);
                    this._loggedIn = true;
                    this._loggedInResolve(); // Pokud se někde v kódu čeká na přihlášení, tímto se "pustí" provádění kódu dále.
                    console.log("Uživatel byl úspěšně přihlášen k Firebase databázi. Dále bude lokální databáze udržovaná v synchronizaci s Firebase databází.");
                    this.addFirebaseValueHandler();
                }
                catch (error) {
                    // Obsluha chyb
                    if (error.code === "auth/network-request-failed") {
                        error_logger_js_1.ErrorLogger.log(error, {
                            errorDescription: "Chyba připojení k internetu. Server bude pracovat v lokální síti.",
                            placeID: 19
                        });
                    }
                    else {
                        error_logger_js_1.ErrorLogger.log(error, {
                            errorDescription: "Během přihlašování serveru k uživatelskému účtu došlo k neznámé chybě! Zřejmě jsou špatně zadány uživ. údaje, vymažte je z configu.",
                            placeID: 0
                        }, {}, 5);
                    }
                }
            }
            else {
                // Obsluha chyb
                let on = await this.online;
                if (on) {
                    error_logger_js_1.ErrorLogger.log(null, {
                        errorDescription: "Neznámá chyba při přihlášení k Firebase databázi!",
                        placeID: 1
                    });
                }
                else {
                    console.log("Server je offline, nebylo možné přihlásit uživatele k Firebase databázi...");
                }
            }
        }
        catch (error) {
            error_logger_js_1.ErrorLogger.log(error, {
                errorDescription: "Neznámá chyba při přihlášení k Firebase databázi! ",
                placeID: 2
            });
        }
    }
    _checkSensorAutomation(updatePath) {
        let oldVal = this.readFromLocalDB(updatePath, 0);
        let newVal = this._sensorsUpdates[updatePath];
        Object.values(this.readFromLocalDB("automations", {})).forEach((automation) => {
            if (automation.type == "automation" && automation.active && updatePath.includes(automation.watchedInput)) { // druhý typ (timeout - časovače zde nevyhodnocujeme); updatePath končí vlastností value, proto je zde porovnání na include...
                if (objectPath.has(this._dbFile, this.correctPath(automation.watchedInput).split("/"))
                    && objectPath.has(this._dbFile, this.correctPath(automation.controlledOutput).split("/"))) { // Kontrola, zda existuje snímač a výstup v databázi (zda nebyl odstraněn)
                    if (automation.thresholdSign == "<") {
                        if (oldVal >= automation.thresholdVal && newVal < automation.thresholdVal) {
                            this.clientUpdateInDB({ path: automation.controlledOutput, data: { value: automation.valueToSet } });
                        }
                    }
                    else if (automation.thresholdSign == ">") {
                        if (oldVal <= automation.thresholdVal && newVal > automation.thresholdVal) {
                            this.clientUpdateInDB({ path: automation.controlledOutput, data: { value: automation.valueToSet } });
                        }
                    }
                    else {
                        let errorDescription = (automation.thresholdVal && automation.thresholdVal.toString().length) ? `Nepodporovaný typ porovnávacího operátoru (${automation.thresholdSign}) v databázi!` : `V databázi se vyskytuje automatizace s nenastaveným porovnávacím operátorem!`;
                        error_logger_js_1.ErrorLogger.log(null, {
                            errorDescription: errorDescription,
                            placeID: 32
                        }, { errorAutomation: automation, database: this.readFromLocalDB("/", {}) });
                    }
                }
            }
        });
    }
    /**
     * Vrací Promise, který po vyhodnocení vrací, zda je server připojen k internetu
     */
    get online() {
        return this._checkConnection();
    }
    /**
     * Funkce vrací Promise, který po vyhodnocení vrací, zda je server připojen k internetu
     * @returns Promise, které po vyhodnocení vrací, zda je server připojen k internetu
     */
    async _checkConnection() {
        if ((this._lastConnCheck + this._onlineValidTimeout) > Date.now()) { // internet connection state is "cached"
            return this._online;
        }
        try {
            this._online = await isOnline({ timeout: this._onlineValidTimeout });
        }
        catch (error) {
        }
        this._lastConnCheck = Date.now();
        return this._online;
    }
    /**
     * Funkce je volaná, pokud se změní data ve Firebase databázi (pokud je server online)
     * @param data Nová data z Firebase databáze
     * @param firstCycle Zda se jedná o první cyklus volání funkce, tzn. nikoli při změně dat v databázi, ale při přiřazení posluchače na změny.
     * @returns Void
     */
    async _firebaseDatabaseUpdateHandler(data, firstCycle) {
        if (firstCycle) { // Pokud se jedná o prvotní získání dat, porovná se aktuálnost dat s lokálními a ty novější přepíšou staré
            this.compareDatabasesAndUpdateOlder(data);
            return; // Není potřeba kontrolovat a zpracovávat změny (funkcemi _checkDbChange a _processDbChanges), jelikož databáze se voláním compareDatabasesAndUpdateOlder "srovnají"
        }
        // Pokud změnu vyvolal server, nechceme změny (znovu) zpracovávat
        if (data && this._ignoredDBTimes.includes(data.lastWriteTime)) {
            return;
        }
        this._checkDbChange(this.readFromLocalDB("/"), data);
    }
    /**
     * Funkce přepíše Firebase databázi lokální verzí databáze
     * @param time Čas poslední změny databáze, měl by se vzít z lokální databáze (nikoli aktuální čas!)
     */
    async _rewriteFireBaseDatabase(time) {
        this._ignoredDBTimes.push(time);
        let uid = await this.userUID;
        /*let snapshot = await this._fb.database().ref(uid + "/").once('value');
        let data = snapshot.val();
        this._checkDbChange(data, this.readFromLocalDB("/")); // Tohle je potřeba, aby v případě, že jsou změny na serveru bez připojení k internetu, tak aby i tak server zpracoval změny
*/
        this._fb.database().ref(uid).remove();
        let updates = { lastWriteTime: time };
        if (this.readFromLocalDB("rooms")) {
            updates["rooms"] = this.readFromLocalDB("rooms");
        }
        if (this.readFromLocalDB("automations")) {
            updates["automations"] = this.readFromLocalDB("automations");
        }
        this._fb.database().ref(uid).update(updates);
    }
    /**
     * Nainicializuje služby Firebase
     */
    initFirebase() {
        if (!this._firebaseInited) {
            this._firebaseInited = true;
            this._fb = firebase.initializeApp(config_reader_js_1.ConfigReader.getValue("firebase"));
        }
    }
    /**
     * Uloží všechny snímače z databáze pro pozdější porovnávání (hodnot snímačů modulů)
     * @param data data z databáze
     * @returns Void
     */
    _getSensors() {
        let _sensors = new Array();
        const rooms = this.readFromLocalDB("rooms", undefined);
        for (const roomID in rooms) {
            const modules = rooms[roomID]["devices"];
            for (const moduleID in modules) {
                const sensors = modules[moduleID]["IN"];
                for (const sensorID in sensors) {
                    sensors[sensorID]["IP"] = modules[moduleID]["IP"];
                    sensors[sensorID]["pathToValue"] = `rooms/${roomID}/devices/${moduleID}/IN/${sensorID}/value`;
                    _sensors.push(sensors[sensorID]);
                }
            }
        }
        return _sensors;
    }
    /**
     * Zkontroluje změny v jedné databázi databázi oproti druhé databázi. Na základě těchto změn se následně (ve funkci this._processDbChanges()) například komunikuje s ESP moduly.
     * Funkce je určena k tomu, že jednak porovnává lokální databázi s Firebase databází, ale i starý obraz lokální databáze s novou databází...
     * @param oldData Stará data
     * @param newData Aktualizovaná data
     * @param comparingLocalDB Rozhoduje, zda se porovnává lokální verze databáze (se svou starší verzí)
     * @returns
     */
    _checkDbChange(oldData, newData, comparingLocalDB = false) {
        this.checkRooms(oldData, newData);
        this.checkAutomations(oldData, newData);
        if (!comparingLocalDB) {
            /*Pokud se proovnává Firebase s lokální datbází, tak se získá rozdíl nových dat (z Firebase databáze) oproti starým (lokálním).
            Všechny změny se uloží lokálně, čímž se this._dbFile srovná s daty ve Firebase databázi*/
            let diffs = diff(oldData, newData); // Získáme rozdíl nových dat oproti starým
            if (diffs) {
                diffs.forEach((diff, index, array) => {
                    if (diff.kind == ObjectChangeTypes.NEW
                        || diff.kind == ObjectChangeTypes.EDITED) {
                        let pathArr = diff.path;
                        let path = diff.path.join("/");
                        let val = objectPath.get(newData, pathArr);
                        let time = (newData.lastWriteTime) ? newData.lastWriteTime : Date.now();
                        this.writeToLocalDB(path, val, time, true, false);
                    }
                    else if (diff.kind == ObjectChangeTypes.DELETED) {
                        let pathArr = diff.path;
                        let path = diff.path.join("/");
                        let time = (newData.lastWriteTime) ? newData.lastWriteTime : Date.now();
                        this.removeInLocalDB(path, time);
                    }
                    else {
                        error_logger_js_1.ErrorLogger.log(null, {
                            errorDescription: "Neznámý typ rozdílu nových dat z databáze...!",
                            placeID: 26
                        }, { diff: diff });
                    }
                });
            }
        }
    }
    checkRooms(oldData, newData) {
        // check rooms
        const newRooms = (newData) ? newData["rooms"] : undefined;
        const oldRooms = (oldData) ? oldData["rooms"] : undefined;
        for (const newRoomID in newRooms) {
            const newRoom = newRooms[newRoomID];
            const oldRoom = (oldRooms) ? oldRooms[newRoomID] : undefined;
            if (!oldRoom) { // Room added
                this._processDbChange({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.ROOM, data: { path: newRoomID } });
            }
            // check modules
            const newModules = newRoom["devices"];
            const oldModules = (oldRoom) ? oldRoom["devices"] : undefined;
            for (const newModuleID in newModules) {
                const newModule = (newModules) ? newModules[newModuleID] : undefined;
                const oldModule = (oldModules) ? oldModules[newModuleID] : undefined;
                if (!oldModule) { // Module added                    
                    if (newModule.index != undefined) { // If module.index is undefined => module was actually deleted from db and only updated by server with ip and type
                        let path = "rooms/" + newRoomID + "/devices/" + newModuleID;
                        console.log('new module path: ', path);
                        this._processDbChange({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.MODULE, data: { id: newModuleID, path: path, ip: newModule.IP } });
                    }
                }
                // check sensors
                const newSensors = (newModule) ? newModule["IN"] : undefined;
                const oldSensors = (oldModule) ? oldModule["IN"] : undefined;
                for (const newSensorID in newSensors) {
                    const newSensor = (newSensors) ? newSensors[newSensorID] : undefined;
                    const oldSensor = (oldSensors) ? oldSensors[newSensorID] : undefined;
                    if (!oldSensor) { // Sensor added
                        let inpt = (newSensor && newSensor.input != undefined) ? newSensor.input.toString() : "";
                        this._processDbChange({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.SENSOR, data: { ip: newModules[newModuleID]["IP"], input: inpt } });
                    }
                    else if (newSensor.input != oldSensor.input) { // sensor changed
                        let oldInpt = (oldSensor && oldSensor.input != undefined) ? oldSensor.input.toString() : "";
                        let newInpt = (newSensor && newSensor.input != undefined) ? newSensor.input.toString() : "";
                        let tp = (newSensors[newSensorID] && newSensors[newSensorID].type != undefined) ? newSensors[newSensorID].type.toString() : "";
                        this._processDbChange({ type: ChangeMessageTypes.REPLACED, level: DevicesTypes.SENSOR, data: { ip: newModules[newModuleID]["IP"], oldInput: oldInpt, newInput: newInpt, type: tp } });
                    }
                }
                // check devices
                const newDevices = newModules[newModuleID]["OUT"];
                const oldDevices = (oldModules && oldModules[newModuleID]) ? oldModules[newModuleID]["OUT"] : undefined;
                for (const newDeviceID in newDevices) {
                    const newDevice = (newDevices) ? newDevices[newDeviceID] : undefined;
                    const oldDevice = (oldDevices) ? oldDevices[newDeviceID] : undefined;
                    const outputOrTypeChanged = oldDevice && ((newDevice.output != oldDevice.output) || (newDevice.type != oldDevice.type));
                    if ((!oldDevice || (newDevice.value != oldDevice.value) || outputOrTypeChanged) && newDevice.output != undefined) { // Device was added (send "new" value to ESP) OR Device value changed OR pin changed
                        let output = (newDevice.type == "analog") ? "A" : "D"; //Map device type (analog/digital) and output pin number to *TYPE*PIN_NUMBER* (eg. A5, D2...)
                        output += newDevice.output.toString().substring(1);
                        let val = Number.parseInt(newDevices[newDeviceID].value);
                        if (newDevice.type == "analog") {
                            if (val < 50) {
                                val = 0;
                                output = "D" + output.substring(1);
                            }
                            if (val > 950) {
                                val = 1023;
                                output = "D" + output.substring(1);
                            }
                        }
                        this._processDbChange({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, data: { ip: newModules[newModuleID]["IP"], output: output, value: val.toString() } });
                        if (outputOrTypeChanged) {
                            let oldOutput = (oldDevice.type == "analog") ? "A" : "D"; //Map device type (analog/digital) and output pin number to *TYPE*PIN_NUMBER* (eg. A5, D2...)
                            oldOutput += oldDevice.output.toString().substring(1);
                            this._processDbChange({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, data: { ip: newModules[newModuleID]["IP"], output: oldOutput, value: 0 } });
                        }
                    }
                }
            }
        }
        //Compare old saved DB with received in order to detect removed things
        for (const oldRoomID in oldRooms) {
            const newRoom = (newRooms) ? newRooms[oldRoomID] : undefined;
            if (!newRoom) { // ROOM was removed
                this._processDbChange({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.ROOM, data: { path: oldRoomID } });
            }
            const oldRoom = (oldRooms) ? oldRooms[oldRoomID] : undefined;
            const newModules = (newRoom) ? newRoom["devices"] : undefined;
            const oldModules = (oldRoom) ? oldRoom["devices"] : undefined;
            for (const oldModuleID in oldModules) {
                const newModule = (newModules) ? newModules[oldModuleID] : undefined;
                if (!newModule) { // MODULE was removed
                    this._processDbChange({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.MODULE, data: { ip: oldModules[oldModuleID].IP } });
                }
                const oldModule = (oldModules) ? oldModules[oldModuleID] : undefined;
                const newSensors = (newModule && newModule["IN"]) ? newModule["IN"] : undefined;
                const oldSensors = (oldModule && oldModule["IN"]) ? oldModule["IN"] : undefined;
                for (const oldSensorID in oldSensors) {
                    const newSensor = (newSensors) ? newSensors[oldSensorID] : undefined;
                    if (!newSensor) { // SENSOR was removed
                        let inpt = (oldSensors[oldSensorID] && oldSensors[oldSensorID].input != undefined) ? oldSensors[oldSensorID].input.toString() : "";
                        this._processDbChange({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.SENSOR, data: { ip: oldModule.IP, input: inpt } });
                    }
                }
                const newDevices = (newModule && newModule["OUT"]) ? newModule["OUT"] : undefined;
                const oldDevices = (oldModule && oldModule["OUT"]) ? oldModule["OUT"] : undefined;
                for (const oldDeviceID in oldDevices) {
                    const newDevice = (newDevices) ? newDevices[oldDeviceID] : undefined;
                    if (!newDevice) { // DEVICE was removed
                        let outpt = (oldDevices[oldDeviceID] && oldDevices[oldDeviceID].output != undefined) ? oldDevices[oldDeviceID].output.toString() : "";
                        this._processDbChange({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.DEVICE, data: { ip: oldModule.IP, output: outpt } });
                    }
                }
            }
        }
    }
    checkAutomations(oldData, newData) {
        const newAutomations = (newData) ? newData["automations"] : undefined;
        const oldAutomations = (oldData) ? oldData["automations"] : undefined;
        let newAutomationIDs = new Array();
        for (const newAutomationID in newAutomations) {
            newAutomationIDs.push(newAutomationID);
            const newAutomation = newAutomations[newAutomationID];
            const oldAutomation = (oldAutomations) ? oldAutomations[newAutomationID] : undefined;
            if (!oldAutomation) { // Automation added
                newAutomation.dbID = newAutomationID;
                this._processDbChange({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.TIMEOUT, data: newAutomation });
            }
            else {
                let diffs = diff(oldAutomation, newAutomation);
                if (diffs && diffs.some((d, index, array) => { return !(d.path[0] == "name" || d.path[0] == "type"); })) {
                    newAutomation.dbID = newAutomationID;
                    this._processDbChange({ type: ChangeMessageTypes.CHANGED, level: DevicesTypes.TIMEOUT, data: newAutomation });
                }
            }
        }
        //Compare old saved DB with received in order to detect removed things
        for (const oldAutomationID in oldAutomations) {
            const newAutomation = (newAutomations) ? newAutomations[oldAutomationID] : undefined;
            const oldAutomation = (oldAutomations) ? oldAutomations[oldAutomationID] : undefined;
            if (!newAutomation) { // Automation was removed
                oldAutomation.dbID = oldAutomationID;
                oldAutomation.controlledOutput = ""; //Nasatavíme ovládaný výstup na "nic", aby se pouze odebral timeout, jestli existuje...
                this._processDbChange({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.TIMEOUT, data: oldAutomation });
            }
        }
    }
    /**
     * Funkce zpracuje změnu v databázi (ve smyslu komunkace s moduly)
     * @param change Konkrétní změna, kterou je potřeba zpracovat
     */
    _processDbChange(change) {
        if (change.level == DevicesTypes.ROOM) { // ZMĚNA NA ÚROVNI MÍSTNOSTI
            if (change.type == ChangeMessageTypes.REMOVED) { // ROOM was removed
            }
        }
        else if (change.level == DevicesTypes.MODULE) { // ZMĚNA NA ÚROVNI MODULU
            if (change.type == ChangeMessageTypes.ADDED) { // Module was added => init communication
                if (change.data.ip == undefined || change.data.ip == "") { //Pokud nebylo nastaven 
                    this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                        /**
                         * Pokud uživatel "zběsile" klikal na přidání modulů, tak se k modulu dostalo několik požadavků na přidání,
                         * v důsledku čehož i odeslal několik "kladných" odpovědí. Přidat jej však chceme jen jednou...
                         */
                        if (this.usedIPsByModules.includes(espIP)) {
                            throw new Error(); // Aby to "spadlo" do carch bloku a došlo k vymazání nového záznamu o modulu z databáze
                        }
                        else {
                            this._communicationManager.sendESPItsID(espIP, change.data.id);
                            this.clientUpdateInDB({ path: change.data.path, data: { IP: espIP, type: boardType } });
                            this.usedIPsByModules.push(espIP);
                        }
                    }).catch((err) => {
                        this.clientRemoveFromDB({ path: change.data.path, data: null });
                    });
                }
                else { //Jinak byl přidán modul již s IP adresou - ale zřejmě by se nemělo stávat
                }
            }
            else if (change.type == ChangeMessageTypes.REMOVED) { // Module was removed => reset module...
                if (change.data.ip) {
                    this._communicationManager.resetModule(change.data.ip);
                    this.usedIPsByModules.splice(this.usedIPsByModules.indexOf(change.data.ip), 1);
                }
            }
        }
        else if (change.level == DevicesTypes.SENSOR) { // ZMĚNA NA ÚROVNI SNÍMAČE
            if (change.type == ChangeMessageTypes.ADDED) { // Snímač byl přidán => je potřeba, aby modul naslouchal novým hodnotám na daném vstupu
                this._communicationManager.ObserveInput(change.data.ip, change.data.input)
                    .catch((err) => {
                    console.log('listenTo err', err);
                });
            }
            else if (change.type == ChangeMessageTypes.REPLACED) { // Sensor was added => listen to new values
                this._communicationManager.changeObservedInput(change.data.ip, change.data.oldInput, change.data.newInput);
            }
            else if (change.type == ChangeMessageTypes.REMOVED) {
                this._communicationManager.stopInputObservation(change.data.ip, change.data.input).catch((err) => {
                    console.log('stopInputObservation err: ', err);
                });
            }
        }
        else if (change.level == DevicesTypes.DEVICE) { // ZMĚNA NA ÚROVNI ZAŘÍZENÍ
            if (change.type == ChangeMessageTypes.VALUE_CHANGED) {
                if (change.data.ip && change.data.output && (change.data.value || change.data.value == 0))
                    this._communicationManager.putVal(change.data.ip, change.data.output, change.data.value);
            }
            else if (change.type == ChangeMessageTypes.REMOVED) {
                if (change.data.ip && change.data.output)
                    this._communicationManager.putVal(change.data.ip, change.data.output, 0);
            }
        }
        else if (change.level == DevicesTypes.TIMEOUT) { // ZMĚNA NA ÚROVNI ČASOVAČŮ
            this._setAutomationTimeoutIfActive(change.data);
        }
        else if (change.level == DevicesTypes.SENSORS_AUTOMATIONS) { // ZMĚNA NA ÚROVNI AUTOMATIZACE SNÍMAČŮ
        }
    }
    /**
     * Funkce zjišťuje, zda se IP modulu již nacházíé v databázi
     * @param newEspIP
     * @returns
     */
    getModulesIPs() {
        const rooms = this.readFromLocalDB("rooms");
        for (const roomID in rooms) {
            const room = rooms[roomID];
            const modules = room["devices"];
            for (const moduleID in modules) {
                const module = modules[moduleID];
                if (module.IP != undefined) {
                    this.usedIPsByModules.push(module.IP);
                }
            }
        }
    }
    /**
     * Funkce přidá posluchače události na změnu databáze.
     * @param path Cesta v databázi, na které chce klient naslouchat (pozorovat změny)
     * @param res objekt pro HTTP odpověď pro pozdější odesílání aktualizací klientům v případě změn na dané cestě v databázi
     */
    addClientDBListener(path, res) {
        path = this.correctPath(path);
        this.clientDBListeners.push({
            path: path,
            res: res
        });
        let DBPart = this.getDBPart(path);
        res.write("data: " + JSON.stringify(DBPart) + "\n\n"); // Počáteční odeslání obrazu databáze
    }
    /**
     * Funkce "ořeže" z cesty počáteční a koncové lomítko, pokud jsou přítomny
     * @param path Ořezávaná cesta
     * @returns Ořezanou cestu
     */
    correctPath(path) {
        path = (path.indexOf("/") == 0) ? path.substring(1) : path;
        path = (path.lastIndexOf("/") == path.length - 1) ? path.substring(0, path.length - 1) : path;
        return path;
    }
    /**
     * Funkce vrací část lokální databáze, specifikované parametrem path. Pokud daná cesta v databázi neexistuje, vrátí null.
     * @param path Cesta, která specifikuje část databáze, která se má vrátit
     * @returns Část lokální databáze, specifikované parametrem path. Pokud daná cesta v databázi neexistuje, vrátí null.
     */
    getDBPart(path) {
        let pathArr = this.correctPath(path).split("/");
        let part = this.readFromLocalDB("/");
        for (let i = 0; i < pathArr.length; i++) {
            if (part[pathArr[i]] != undefined) {
                part = part[pathArr[i]];
            }
            else {
                part = null;
                break;
            }
        }
        return part;
    }
    /**
     * Funkce vrací část lokální databáze, specifikované parametrem path. Pokud daná cesta v databázi neexistuje, vrátí undefined.
     * @param path Cesta, která specifikuje část databáze, která se má vrátit
     * @param defaultValueIfPathNotExists Hodnota, která se vrací, pokud uvedená cesta v databázi neexistuje
     * @returns Část lokální databáze, specifikované parametrem path. Pokud daná cesta v databázi neexistuje, vrátí undefined (resp. defaultValueIfPathNotExists, pokud je parametr specifikován).
     */
    readFromLocalDB(path, defaultValueIfPathNotExists) {
        return this.readFromDBObject(this._dbFile, path, defaultValueIfPathNotExists);
    }
    /**
     * Funkce vrací část JAKÉKOLI databáze, specifikované parametrem path a dbObject(objekt databáze, které část se získává). Pokud daná cesta v databázi neexistuje, vrátí undefined.
     * @param dbObject Objekt databáze, ze které se vrací část daná cestou path
     * @param path Cesta, která specifikuje část databáze, která se má vrátit
     * @param defaultValueIfPathNotExists Hodnota, která se vrací, pokud uvedená cesta v databázi neexistuje
     * @returns Část JAKÉKOLI databáze, specifikované parametrem path a dbObject(objekt databáze, které část se získává). Pokud daná cesta v databázi neexistuje, vrátí undefined (resp. defaultValueIfPathNotExists, pokud je parametr specifikován).
     */
    readFromDBObject(dbObject, path, defaultValueIfPathNotExists) {
        if (path.length == 0 || path == "/") {
            if (dbObject) {
                return dbObject;
            }
            else {
                return (defaultValueIfPathNotExists == undefined) ? undefined : defaultValueIfPathNotExists;
            }
        }
        else {
            let pathArr = this.correctPath(path).split("/");
            if (objectPath.has(dbObject, pathArr)) {
                return objectPath.get(dbObject, pathArr);
            }
            else {
                return (defaultValueIfPathNotExists == undefined) ? undefined : defaultValueIfPathNotExists;
            }
        }
    }
    /**
     * Funkce zapíše hodnotu do lokální databáze
     * @param path Cesta v databázi, na kterou se má zapsat
     * @param val Zapisovaná hodnota
     * @param time Čas, který se má zapsat jako poslední změny
     */
    async writeToLocalDB(path, val, time, rewriteLastWriteTime = true, checkAndProcessDbChanges = true) {
        if (time == undefined) {
            time = Date.now();
        }
        await this._loadLocalDBFromFile();
        let tmpDbFile = JSON.parse(JSON.stringify(this.readFromLocalDB("/", {}))); // Záloha lokální databáze pro pozdější vyhodnocení změn funkcí _checkDbChange() (viz níže ve funkci)
        let processUpdate = () => {
            let pathArr = this.correctPath(path).split("/");
            let part = this.readFromLocalDB(path);
            if (typeof part == "object" && typeof val == "object") { // Pokud jsou v daném umístění objekty, uložíme deep merge těchto objektů
                objectPath.set(this._dbFile, pathArr, merge(part, val));
            }
            else { // Jinak prostě nahradíme starou hodnotu novou hodnotou
                objectPath.set(this._dbFile, pathArr, val);
            }
        };
        if (path.length == 0 || path == "/") {
            path = "/";
            if (val.rooms || val.automation) {
                if (val.rooms) {
                    let part = this.readFromLocalDB("rooms");
                    objectPath.set(this._dbFile, "rooms", merge(part, val.rooms));
                }
                if (val.automation) {
                    let part = this.readFromLocalDB("automation");
                    objectPath.set(this._dbFile, "automation", merge(part, val.automation));
                }
            }
            else { // Jinak víme, že přišla cesta "/"", a data ve formátu, který obsahuj cestu (např. 'rooms/-MYRjLerob8wpXvP4bxZ/devices/-MYTWRVGgRyE32PCruIi/IN/-MYTe9Otf3NLzkDHV65Z/value': 297). 
                let updates = val;
                let updatesObjectArray = new Array();
                path = (Object.keys(updates)[0].startsWith("rooms") || Object.keys(updates)[0].startsWith("/rooms")) ? "rooms" : "automation";
                for (const longPathName in updates) {
                    let pathArr = longPathName.split("/").slice(1);
                    let updateObject = {};
                    updateObject[pathArr[pathArr.length - 1]] = updates[longPathName];
                    for (let i = pathArr.length - 2; i >= 0; i--) {
                        let tmp = {};
                        tmp[pathArr[i]] = updateObject;
                        updateObject = tmp;
                    }
                    updatesObjectArray.push(updateObject);
                }
                val = merge.all(updatesObjectArray);
                processUpdate();
            }
        }
        else {
            processUpdate();
        }
        if (rewriteLastWriteTime) {
            this._dbFile["lastWriteTime"] = time;
        }
        for (let i = 0; i < this.clientDBListeners.length; i++) {
            if (path.includes(this.clientDBListeners[i].path)) { // Aktualizace je v cestě, na které klient naslouchá
                let DBPart = this.getDBPart(this.clientDBListeners[i].path);
                this.clientDBListeners[i].res.write("data: " + JSON.stringify(DBPart) + "\n\n");
            }
        }
        jsonManager.writeFileSync(dbFilePath, this.readFromLocalDB("/"), { spaces: 2 });
        if (checkAndProcessDbChanges) { //Ještě uložit zkontrolovat a zpracovat změny z pohledu modulů...
            this._checkDbChange(tmpDbFile, this.readFromLocalDB("/"), true);
        }
    }
    /**
     * Funkce smaže záznam na dané cestě (parametr path) z lokální databáze.
     * @param path Cesta, na které se má mazat
     * @param time Čas, který se má zapsat jako poslední změny
     */
    async removeInLocalDB(path, time) {
        if (time == undefined) {
            time = Date.now();
        }
        await this._loadLocalDBFromFile();
        let tmpDbFile = JSON.parse(JSON.stringify(this.readFromLocalDB("/", {}))); // Záloha lokální databáze pro pozdější vyhodnocení změn funkcí _checkDbChange() (viz níže ve funkci)
        if (path.length == 0 || path == "/") {
            fs.writeFileSync(dbFilePath, '{}');
            this._dbFile = {};
            this._dbFile["lastWriteTime"] = time;
            jsonManager.writeFileSync(dbFilePath, this.readFromLocalDB("/"), { spaces: 2 });
        }
        else {
            let pathArr = this.correctPath(path).split("/");
            objectPath.del(this._dbFile, pathArr);
            this._dbFile["lastWriteTime"] = time;
            jsonManager.writeFileSync(dbFilePath, this.readFromLocalDB("/"), { spaces: 2 });
        }
        for (let i = 0; i < this.clientDBListeners.length; i++) { // Ještě poslat aktualizaci klientům, kteří naslouchali změnám na dané cestě
            if (path.includes(this.clientDBListeners[i].path)) { // Aktualizace je v cestě, na které klient naslouchá
                let DBPart = this.getDBPart(this.clientDBListeners[i].path);
                this.clientDBListeners[i].res.write("data: " + JSON.stringify(DBPart) + "\n\n");
            }
        }
        //Ještě uložit zkontrolovat a zpracovat změny z pohledu modulů...
        this._checkDbChange(tmpDbFile, this.readFromLocalDB("/"), true);
    }
    /**
     * Funkce aktualizuje lokální (a v případě připojení k internetu i Firebase) databázi. Funkce je volaná na základě požadavku webového klienta.
     * @param bodyData Data z těla POST požadavku, obsahují cestu v databázi, na kterou se klient "ptá" a aktualizovaná data.
     * @param rewriteLastWriteTime Rozhoduje, zda se má v databázi přepsat čas poslední změny. Při zápisu hodnoty snímačů musí být false, jinak true.
     */
    async clientUpdateInDB(bodyData, rewriteLastWriteTime = true) {
        let path = this.correctPath(bodyData.path);
        let updates = bodyData.data;
        let time = Date.now();
        let uid = await this.userUID;
        if (uid && await this.online && await this.firebaseInited) {
            this._ignoredDBTimes.push(time);
            if (rewriteLastWriteTime) {
                await this._fb.database().ref(uid + "/").update({ lastWriteTime: time });
            }
            await this._fb.database().ref(uid + "/" + path).update(updates);
        }
        else {
            console.log("zkontrolovat zda není problém s uid");
        }
        this.writeToLocalDB(path, updates, time, rewriteLastWriteTime);
    }
    /**
     * Funkce vloží nová data do lokální (a v případě připojení k internetu i Firebase) databázi. Funkce je volaná na základě požadavku webového klienta.
     * @param bodyData Data z těla POST požadavku, obsahují cestu v databázi, na kterou se klient "ptá" a nová data.
     * @returns Promise, která po resolvnutí vrací klíč/id nového záznamu
     */
    async clientPushToDB(bodyData) {
        let path = this.correctPath(bodyData.path);
        let data = bodyData.data;
        let randomKey = "";
        let time = Date.now();
        let uid = await this.userUID;
        if (uid && (await this.online)) {
            this._ignoredDBTimes.push(time);
            await this._fb.database().ref(uid).update({ lastWriteTime: time });
            randomKey = (await this._fb.database().ref().child(uid + "/" + path).push(data)).key;
        }
        else {
            console.log("zkontrolovat zda není problém s uid!!");
            console.log("prohodit online!");
            let charArr = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            for (let i = 0; i < 20; i++) {
                let newChar = charArr[Math.floor(Math.random() * charArr.length)];
                randomKey += newChar;
            }
        }
        this.writeToLocalDB(path + "/" + randomKey, data, time);
        return randomKey;
    }
    /**
     * Funkce získá část lokální (resp. v případě připojení k internetu Firebase) databáze. Funkce je volaná na základě požadavku webového klienta.
     * @param bodyData Data z těla POST požadavku, obsahují cestu v databázi, na kterou se klient "ptá".
     */
    async clientGetFromDB(bodyData) {
        let path = this.correctPath(bodyData.path);
        return this.getDBPart(path);
        /*let uid = await this.userUID;
        if (uid && (await this.online) && (await this.firebaseInited)) {
            try {
                let snapshot = await this._fb.database().ref(uid + "/" + path).once('value');
                return snapshot.val();
            } catch (error) {
                return null;
            }
        } else {
            return this.getDBPart(path);
        }*/
    }
    /**
     * Funkce odstraní část lokální (resp. v případě připojení k internetu i Firebase) databáze. Funkce je volaná na základě požadavku webového klienta.
     * @param bodyData Data z těla POST požadavku, obsahují cestu v databázi, na kterou se klient "ptá".
     */
    async clientRemoveFromDB(bodyData) {
        let path = this.correctPath(bodyData.path);
        let time = Date.now();
        let uid = await this.userUID;
        if (uid && (await this.online) && (await this.firebaseInited)) {
            this._ignoredDBTimes.push(time);
            await this._fb.database().ref(uid).update({ lastWriteTime: time });
            await this._fb.database().ref(uid + "/" + path).remove();
        }
        else {
        }
        this.removeInLocalDB(path, time);
    }
    /**
     * Funkce dle parametru fromFirebase nahradí jednu z databází (lokální nebo Firebase databází) tou druhou.
     * @param fromFirebase Rozhoduje o směru kopírování. V případě true se nahradí lokální databáze tou z Firebase databáze.
     * V opačném případě se lokální databáze nahraje do Firebase databáze.
     */
    async copyDatabase(fromFirebase) {
        let uid = await this.userUID;
        if (fromFirebase) { // Lokální soubor se přepíše verzí databáze z Firebase
            let snapshot;
            try {
                snapshot = await this._fb.database().ref(uid).once('value');
            }
            catch (error) {
            }
            let data;
            if (!snapshot) {
                data = {};
            }
            else {
                data = snapshot.val();
            }
            let time = (data.lastWriteTime) ? data.lastWriteTime : Date.now();
            this.removeInLocalDB("/", time);
            if (data.rooms) {
                this.writeToLocalDB("rooms", data.rooms, time);
            }
            if (data.automation) {
                this.writeToLocalDB("automation", data.automation, time);
            }
        }
        else { // Firebase databáze se přepíše lokálním souborem
            let time = Date.now();
            this._ignoredDBTimes.push(time);
            this.writeToLocalDB("lastWriteTime", time, time);
            await this._fb.database().ref(uid).update({ lastWriteTime: time });
            await this._fb.database().ref(uid).remove();
            await this._fb.database().ref(uid).update(this.readFromLocalDB("/"));
        }
    }
    /**
     * Funkce porovná, která z databází (lokální/Firebase) je aktuálnější a tu starší nahradí novou
     * @param data Data z Firebase databáze
     */
    async compareDatabasesAndUpdateOlder(data) {
        let serverLastWriteTime = this.readFromLocalDB("lastWriteTime", 0);
        let firebaseLastWriteTime = (data && data.lastWriteTime) ? data.lastWriteTime : 0;
        if (serverLastWriteTime < firebaseLastWriteTime) { // Pokud bylo naposledy zapisováno do firebase, přepíše se lokální verze databáze
            console.log("Internetová verze (Firebase) databáze je aktuálnější. Přepíše lokální databázi...");
            this._checkDbChange(this.readFromLocalDB("/", {}), data);
        }
        else if (serverLastWriteTime > firebaseLastWriteTime) { // Pokud bylo naposledy zapisováno lokálně, přepíše se firebase databáze
            console.log("Lokální verze databáze je aktuálnější. Přepíše databázi na internetu (Firebase databázi)...");
            this._rewriteFireBaseDatabase(serverLastWriteTime);
        }
        else { //Jinak jsou zřejme databáze v synchronizaci
            let dbAreDifferent = (diff(this.readFromLocalDB("/", {}), data) != undefined);
            if (dbAreDifferent) { // Uložený čas poslední změny je sice stejný, ale vypadá to, že některá data byla upravena (zřejmě manuálně), předpokládá se, že lokální databáze má vyšší prioritu, přepíše tedy Firebase databázi
                console.log("Ačkoli časy posledních změn lokální i vzdálené databáze odpovídají, některá data jsou rozdílná. Lokální databáze přpíše databázi na internetu (Firebase databázi)...");
                this._rewriteFireBaseDatabase(serverLastWriteTime);
            }
            else {
                console.log("Lokální i Firebase databáze jsou v synchronizaci, není potřeba přepisovat žádnou");
            }
        }
    }
}
exports.Firebase = Firebase;
var ChangeMessageTypes;
(function (ChangeMessageTypes) {
    ChangeMessageTypes[ChangeMessageTypes["REMOVED"] = 0] = "REMOVED";
    ChangeMessageTypes[ChangeMessageTypes["ADDED"] = 1] = "ADDED";
    ChangeMessageTypes[ChangeMessageTypes["REPLACED"] = 2] = "REPLACED";
    ChangeMessageTypes[ChangeMessageTypes["VALUE_CHANGED"] = 3] = "VALUE_CHANGED";
    ChangeMessageTypes[ChangeMessageTypes["CHANGED"] = 4] = "CHANGED";
})(ChangeMessageTypes || (ChangeMessageTypes = {}));
var DevicesTypes;
(function (DevicesTypes) {
    DevicesTypes[DevicesTypes["ROOM"] = 0] = "ROOM";
    DevicesTypes[DevicesTypes["MODULE"] = 1] = "MODULE";
    DevicesTypes[DevicesTypes["SENSOR"] = 2] = "SENSOR";
    DevicesTypes[DevicesTypes["DEVICE"] = 3] = "DEVICE";
    DevicesTypes[DevicesTypes["UNKNOWN"] = 4] = "UNKNOWN";
    DevicesTypes[DevicesTypes["TIMEOUT"] = 5] = "TIMEOUT";
    DevicesTypes[DevicesTypes["SENSORS_AUTOMATIONS"] = 6] = "SENSORS_AUTOMATIONS";
    DevicesTypes[DevicesTypes["LAST_WRITE_TIME"] = 7] = "LAST_WRITE_TIME";
})(DevicesTypes || (DevicesTypes = {}));
var DataSources;
(function (DataSources) {
    DataSources[DataSources["FIREBASE"] = 0] = "FIREBASE";
    DataSources[DataSources["LOCAL_DATABASE"] = 1] = "LOCAL_DATABASE";
})(DataSources || (DataSources = {}));
var ObjectChangeTypes;
(function (ObjectChangeTypes) {
    ObjectChangeTypes["NEW"] = "N";
    ObjectChangeTypes["DELETED"] = "D";
    ObjectChangeTypes["EDITED"] = "E";
    //ADDED = "A"
})(ObjectChangeTypes || (ObjectChangeTypes = {}));
