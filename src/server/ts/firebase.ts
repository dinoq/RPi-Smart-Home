
var firebase = require('firebase');
const fs = require("fs");
const isOnline = require('is-online');
const editJsonFile = require("edit-json-file");
const jsonManager = require("jsonfile");
const objectPath = require("object-path");
const merge = require('deepmerge')
const odiff = require('odiff');

import { SensorInfo, VALUE_TYPE } from "./ESP.js";
import { CommunicationManager } from "./communication-manager.js";

const dbFilePath = "local-database.json";

export class Firebase {
    private _config;
    private _fb;
    private _firebaseInited = false; // Slouží pro informaci, zda byly již nainicializovány služby Firebase (v případě, že je server spuštěn bez přístupu k internetu, tak je nutné je po připojení k internetu nainicializovat)
    private _dbFile;

    private _previousOnline = false;
    private _online = false;
    _onlineValidTimeout: number = 1000;
    _lastConnCheck: number = 0;

    private _dbInited: boolean = false;
    private _loggedIn: boolean = false;
    private _loggedInResolve;
    private _loggedInPromise;
    private _communicationManager: CommunicationManager;
    private _sensors: Array<any> = new Array();

    private _sensorsUpdates: object = {};
    private _updateSensorsInDBTimeout: any = undefined;
    private _loginInfo: { username: string; pwd: string; };

    private _ignoredDBTimes = new Array(); // Obsahuje časy aktualizací z databáze, které jsou serverem ignorovány (protože změnu vyvolal sám, nechce tedy změny znovu zpracovávat)

    private _firebaseHandlerActive = false; // Označuje, zda je aktivní posluchač události změny firebase databáze
    public get loggedIn(): boolean {
        return this._loggedIn;
    }

    changes: IChangeMessage[] = new Array();

    constructor() {
        // Načtení lokální databáze
        if (fs.existsSync(dbFilePath)) {// Pokud existuje soubor s lokální databází, načte se.
            this._dbFile = jsonManager.readFileSync(dbFilePath);
        }else{ // V opačném případě se vytvoří a nainicializuje na prázdný (JSON) objekt
            fs.writeFileSync(dbFilePath, '{}');
            this._dbFile = {};
        }
        if(typeof this._dbFile != "object"){ // Kontrola, zda se načetl regulérní JSON objekt
            this._dbFile = {};
        }

        // Vytvoření Promise, která se resolvne při přihlášení. Využívá se, pokud je někde potřeba čekat na přihlášení do Firebase.
        this._loggedInPromise = new Promise((resolve, reject) => { this._loggedInResolve = resolve; });

        this._config = editJsonFile("config.json", {
            autosave: true
        });
        // TODO: Kontrola zda existuje config.json
        //TODO pokud neexistuje, vytvořit a nainicializovat na defaultní hodnoty!

        this._communicationManager = new CommunicationManager();

        this.online.then((online) => {
            if (online) {
                this.initFirebase();
            } else {

            }
        })

        // Nastaví se timeout na kontrolu připojení k internetu. Ten se znovu nastavuje opět ve funkci this.connectionCheckInterval()
        setTimeout(this.connectionCheckInterval, this._onlineValidTimeout);

    }

    /**
     * Funkce je volána pravidelně, aby kontrolovala připojení k internetu a v případě ztráty (či opětovném) připojení provede dané akce...
     */
    connectionCheckInterval = async () => {
        let online = await this.online;
        let fbInited = await this.firebaseInited;

        if (!this.loggedIn && online && this._loginInfo) { // Pokud se z nějakého důvodu nepodařilo přihlásit (ověřit) uživatele ve firebase (např. server v době spuštění nebyl online) a je nyní server online, přihlásí uživatele
            this.login(this._loginInfo.username, this._loginInfo.pwd);
        }

        if (this.loggedIn) {
            let uid = this._fb.auth().currentUser.uid;
            if (!online && this._previousOnline) { // Stav se změnil z online na offline
                console.log("Server přechází do režimu offline!");
                this._firebaseHandlerActive = false;
                this._fb.database().ref(uid).off(); // Je potřeba odstranit posluchače na změnu databáze

            } else if (online && !this._previousOnline) { //Stav se změnil z offline na online
                console.log("Server opět v režimu online!");
                this.addFirebaseValueHandler();
            }
        }


        this._previousOnline = online;
        setTimeout(this.connectionCheckInterval, this._onlineValidTimeout);
    }


    /**
     * Funkce přidá serveru posluchače události změny hodnot v databázi (na nejvyšší úrovni, registruje tedy každou změnu v databázi pro daného uživatele)
     * @returns 
     */
    private async addFirebaseValueHandler() {
        if (this._firebaseHandlerActive) {
            return;
        }

        this._firebaseHandlerActive = true;
        let firstCycle = true;
        this._fb.database().ref(await this.userUID).on('value', (snapshot) => {
            const data = snapshot.val();
            this._databaseUpdatedHandler(data, firstCycle);
            firstCycle = false;
        });
    }

    /**
     * Vrací, zda jsou již služby firebase nainicializovány. 
     * Zároveň pokud nejsou, tak se je pokusí nainicializovat a až pak vrací výsledek operace. 
     * Je-li tedy nutné mít k něčemu tyto služby nainicializovány, postačí se dotázat na tuto vlastnost (firebaseInited) 
     * a není třeba nejprve volat dsmotnout inicializaci...
     */
    public get firebaseInited(): Promise<boolean> {
        return this.online.then((online) => {
            if (online) {
                if (!this._firebaseInited) {
                    this.initFirebase();
                }
                return true;
            } else {
                //console.warn("Možná zde bude nutné vracet false a ne this._firebaseInited. Needs work (zamyslet se!)...TODO")
                return this._firebaseInited;
            }
        })
    }

    /**
     * Vrací unikátní ID uživatele z Firebase služeb. 
     * Pokud nejsou služby nainicializovány a nic tomu nebrání, tak se nejprve nainicializují a až pak se vrátí UID.
     */
    public get userUID(): Promise<string> {
        return this.firebaseInited.then((firebaseInited) => {
            return this.online.then((online) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(null) }, 5000); // Ochrana před "zaseknutím" programu, pokud by čekal na získání userUID a _loggedInPromise se z nějakého důvodu "neresolvnul"
                    return this._loggedInPromise.then((value) => {
                        resolve(firebase.auth().currentUser.uid);
                    })

                })
            })
        })
    }

    /**
     * Funkce přihlásí uživatele přes autentizační server Firebase a přidá posluchače události změny hodnot ve Firebase databázi.
     * @param username Přihlašovací jméno (email)
     * @param pwd Heslo
     */
    public login(username: string, pwd: string) {
        this._loginInfo = { username: username, pwd: pwd }

        this.firebaseInited.then((inited) => {
            if (inited) {
                if (this.loggedIn) {
                    return;
                }
                firebase.auth().signInWithEmailAndPassword(username, pwd)
                    .then((user) => {
                        console.log("Uživatel byl úspěšně ověřen, server pracuje.");

                        //this.debugApp();

                        this._loggedInResolve(); // Pokud se někde v kódu čeká na přihlášení, tímto se "pustí" provádění kódu dále.
                        this._loggedIn = true;
                        this.addFirebaseValueHandler();
                        this._communicationManager.initCoapServer(this._CoAPIncomingMsgCallback);


                    }).catch((error) => {
                        if (error.code === "auth/network-request-failed") {
                            console.log("Chyba připojení k internetu. Server bude pracovat v lokální síti.");
                        } else {
                            console.log("Během přihlašování serveru k uživatelskému účtu došlo k neznámé chybě: " + error.message + "\nAplikace se ukončí...");
                            process.exit(5);
                        }
                    });
            } else {
                console.log("Chyba přihlášení k firebase");
            }
        })
    }

    //Todo smazat funcki debugApp()
    private debugApp() {
        let debugIP = "192.168.1.8";
        this._communicationManager.resetModule(debugIP); //TODO: delete
        setTimeout(() => {
            let change = JSON.parse("{\"type\":1,\"level\":1,\"data\":{\"id\":\"-MVwvZHnfCbecnYYOtEf\",\"path\":\"rooms/-MVwvYAL2RM_XyOKV4lH/devices/-MVwvZHnfCbecnYYOtEf\"}}");
            this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                console.log("ADD " + espIP + "to" + firebase.auth().currentUser.uid);
                this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP, type: boardType });
                this._communicationManager.sendESPItsID(espIP, change.data.id);
                console.log('change.data.id: ', change.data.id);

                setTimeout(() => {
                    this._communicationManager.ObserveInput(debugIP, "A17").catch((value) => {
                        console.log('err1 value: ', value);

                    });
                }, 2000);
                setTimeout(() => {
                    this._communicationManager.ObserveInput(debugIP, "I2C-SHT21-teplota").catch((value) => {
                        console.log('err2 value: ', value);

                    });
                }, 2000);

                setTimeout(() => {
                    this._communicationManager.putVal(debugIP, "D2", 700);
                    setTimeout(() => {
                        this._communicationManager.putVal(debugIP, "D2", 100);
                    }, 7000);
                }, 3000);

            }).catch((err) => {
                console.log('initCommunicationWithESP err: ', err);
            })


        }, 5000);
    }

    private _CoAPIncomingMsgCallback = (req: any, res: any) => {
        console.log('coap request');
        if (req.url == "/new-value") { // New value from sensor arrived
            let val_type = req.payload[req.payload.length - 2];
            let IN = Number.parseInt(req.payload[req.payload.length - 1]) - 1;
            let valStr = req.payload.toString().substring("in:".length, req.payload.length - 2);
            let val;
            if (valStr == "??") {
                this._updateSensor(new SensorInfo(IN, val_type, valStr), req.rsinfo.address);
            } else {
                if (val_type == VALUE_TYPE.I2C) {
                    val = Number.parseFloat(valStr).toFixed(1);
                } else {
                    val = Number.parseInt(valStr);
                }
                this._updateSensor(new SensorInfo(IN, val_type, val), req.rsinfo.address);
            }
        } else if (req.url == "/get-all-IO-state") { // module needs init its inputs and outputs
            const moduleIP = req.rsinfo.address;
            let IN: string = "";
            let OUT: string = "";
            let moduleFoundedInDB: boolean = false;
            const rooms = this.readFromLocalDB("rooms");
            for (const roomID in rooms) {
                const room = rooms[roomID];
                const modules = room["devices"];
                for (const moduleID in modules) {
                    const module = modules[moduleID];
                    if (module.IP == moduleIP) { // If this module IP matches IP of modules from which message came, init IN and OUT.
                        moduleFoundedInDB = true;
                        const sensors: any = module["IN"];
                        for (const sensorID in sensors) {
                            IN = (IN) ? IN + "|" : "IN:";
                            IN += sensors[sensorID].input;
                        }
                        const devices = module["OUT"];
                        for (const deviceID in devices) {
                            let output = (devices[deviceID].type == "analog") ? "A" : "D"; //First convert val to rigt type (ANALOG/DIGITAL)
                            output += devices[deviceID].output.substring(1);
                            OUT = (OUT) ? OUT + "|" : "OUT:";
                            OUT += output + "=" + devices[deviceID].value;
                        }

                    }
                }
            }
            IN = (IN) ? IN : "IN:";
            OUT = (OUT) ? OUT : "OUT:";

            if (moduleFoundedInDB) {
                /*
                let addToOptions = (name, val) => {
                    res._packet.options.push({
                        name: name,
                        value: Buffer.from(val)
                    });
                }
                addToOptions("Uri-Host", moduleIP);
                addToOptions("Uri-Path", "set-all-IO-state");
                addToOptions("Uri-Query", IN);
                addToOptions("Uri-Query", OUT);
                res._packet.ack = false; // Send it not as response, but new request
                res.end();*/
                this._communicationManager.setAllIO(moduleIP, IN + "&" + OUT);
            } else if (this._dbInited) { // Module was probably deleted from database, when module was OFF => reset that module
                this._communicationManager.resetModule(moduleIP);
            } else { // db was still not inited in server...
                //console.log("DB was not still inited in server");
            }
        }
    }

    private _updateSensor = async (sensorInfo: SensorInfo, moduleIP) => {
        let moduleFoundedInDB: boolean = false;
        this._sensors.forEach((sensor, index, array) => {
            if (moduleIP == sensor.IP) {
                moduleFoundedInDB = true;
                if (sensorInfo.val != sensor.value
                    && sensorInfo.getInput() == sensor.input) { // If value changed and sensor input record exists in this_sensors, save change to DB
                    this._sensorsUpdates[sensor.pathToValue] = sensorInfo.val;
                    sensor.value = sensorInfo.val;
                }
            }
        })
        if (moduleFoundedInDB) {
            if (!this._updateSensorsInDBTimeout) {
                this._updateSensorsInDBTimeout = setTimeout(this._updateSensorsInDB, 200);
            }
        } else if (this._dbInited) { // Module was probably deleted from database, when module was OFF => reset that module
            this._communicationManager.resetModule(moduleIP);
        } else { // Else db is still not inited => try update later...
            setTimeout(() => { this._updateSensor(sensorInfo, moduleIP) }, 1000);
        }
    }

    private _updateSensorsInDB = async () => {
        this._updateSensorsInDBTimeout = undefined;
        if (this._sensorsUpdates && Object.keys(this._sensorsUpdates).length != 0) {
            console.log((Math.floor(Date.now() / 1000) - 1616084626) + '| updates: ', this._sensorsUpdates);
            console.log('this._online: ', this._online);
            if (await this.online) {
                for (const updatePath in this._sensorsUpdates) {
                    //this._dbFile.set(updatePath.split("/").join("."), this._sensorsUpdates[updatePath]);
                    //TODO!!!
                }

                await firebase.database().ref().update(this._sensorsUpdates);
            }
            this._sensorsUpdates = {};
        }
    }

    public get online(): Promise<boolean> {
        return this._checkConnection();
    }

    private async _checkConnection(): Promise<boolean> {
        if ((this._lastConnCheck + this._onlineValidTimeout) > Date.now()) { // internet connection state is "cached"
            return this._online;
        }
        try {
            this._online = await isOnline({ timeout: 2000 });
            if (!this._online) { // Pokud je zařízení offline, kontrolovat zda se stav nezměnil...Kontrola se provede po vypršení platnosti údaje o připojení (proměnná this._onlineValidTimeout)
                setTimeout(() => this._checkConnection(), this._onlineValidTimeout)
            }
        } catch (error) {
        }
        this._lastConnCheck = Date.now();
        return this._online;
    }

    /**
     * 
     * @param data Nová data
     * @param firstCycle Zda se jedná o první cyklus volání funkce, tzn. nikoli při změně dat v databázi, ale při přiřazení posluchače na změny.
     * @returns 
     */
    private async _databaseUpdatedHandler(data: any, firstCycle: boolean) {
        if (data && this._ignoredDBTimes.includes(data.lastWriteTime)) {
            /*let index = this._ignoredDBTimes.indexOf(data.lastWriteTime);
            this._ignoredDBTimes.splice(index, 1);*/
            return;
        }
        if (firstCycle) {
            let serverLastWriteTime = this.readFromLocalDB("lastWriteTime", 0);
            let firebaseLastWriteTime = (data && data.lastWriteTime) ? data.lastWriteTime : 0;

            if (serverLastWriteTime < firebaseLastWriteTime) { // Pokud bylo naposledy zapisováno do firebase, přepíše se lokální verze databáze
                console.log("Vypadá to, že internetová verze databáze je aktuálnější. Přepíše lokální databázi...");
                fs.writeFileSync(dbFilePath, '{}');
                if (data && data.rooms) {
                    this.writeToLocalDB("rooms", data.rooms, firebaseLastWriteTime);
                } else {
                    this.writeToLocalDB("lastWriteTime", firebaseLastWriteTime, firebaseLastWriteTime);
                }
            } else { // Pokud bylo naposledy zapisováno lokálně NEBO je čas stejný, přepíše se firebase databáze
                console.log("Vypadá to, že lokální verze databáze je aktuálnější. Přepíše databázi na internetu...");
                this._fb.database().ref(await this.userUID).remove();
                let updates = { lastWriteTime: serverLastWriteTime };
                if (this.readFromLocalDB("rooms")) {
                    updates["rooms"] = this.readFromLocalDB("rooms");
                }
                this._fb.database().ref(await this.userUID).update(updates);
            }
        }
        if (!this._dbInited) {
            this.getSensors(data);
            this._dbInited = true;
        } else {
            this._checkDbChange(data);
            this._processDbChanges();
        }
    }

    initFirebase() {
        if (!this._firebaseInited) {
            this._firebaseInited = true;
            this._fb = firebase.initializeApp(this._config.get("firebase"));
        }
    }

    getSensors(data) {
        if (!data)
            return

        this._sensors = new Array();

        const rooms = data["rooms"];
        for (const roomID in rooms) {
            const modules = rooms[roomID]["devices"];
            for (const moduleID in modules) {
                const sensors = modules[moduleID]["IN"];
                for (const sensorID in sensors) {
                    sensors[sensorID]["IP"] = modules[moduleID]["IP"];
                    sensors[sensorID]["pathToValue"] = `${firebase.auth().currentUser.uid}/rooms/${roomID}/devices/${moduleID}/IN/${sensorID}/value`;
                    this._sensors.push(sensors[sensorID]);
                }
            }

        }
    }

    private _checkDbChange(data) {
        if (!data) {
            if (this.readFromLocalDB("/")) { // everything was deleted
                //TODO!!! (resetovat všechny moduly atd...)
                //TODO!!! smazat vše i z lokální db (_dbFile)
            }
            return
        }

        // check rooms
        const newRooms = (data) ? data["rooms"] : undefined;
        const localRooms = this.readFromLocalDB("rooms");
        let newRoomsIDs = new Array();
        for (const newRoomID in newRooms) {
            newRoomsIDs.push(newRoomID);
            const room = newRooms[newRoomID];
            const localRoom = (localRooms) ? localRooms[newRoomID] : undefined;
            if (!localRoom) { // Room added
                this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.ROOM, data: { path: newRoomID } });
            }

            // check modules
            const modules = room["devices"];
            const localModules = (localRoom) ? localRoom["devices"] : undefined;
            for (const moduleID in modules) {
                const module = (modules) ? modules[moduleID] : undefined;
                const localModule = (localModules) ? localModules[moduleID] : undefined;
                if (!localModule) {// Module added                    
                    if (module.index != undefined) { // If module.index is undefined => module was actually deleted from db and only updated by server with ip and type
                        let path = "rooms/" + newRoomID + "/devices/" + moduleID;
                        console.log('new module path: ', path);
                        this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.MODULE, data: { id: moduleID, path: path } });
                    }
                }

                // check sensors
                const sensors = (module) ? module["IN"] : undefined;
                const localSensors = (localModule) ? localModule["IN"] : undefined;
                for (const sensorID in sensors) {
                    const sensor = (sensors) ? sensors[sensorID] : undefined;
                    const localSensor = (localSensors) ? localSensors[sensorID] : undefined;
                    if (!localSensor) {// Sensor added
                        this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.SENSOR, data: { ip: modules[moduleID]["IP"], input: sensor.input.toString() } });
                        //Add also to sensors in order to update in DB
                        sensor["IP"] = modules[moduleID]["IP"];
                        sensor["pathToValue"] = `${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`;
                        this._sensors.push(sensor);
                    } else if (sensor.input != localSensor.input) { // sensor changed
                        //find old sensor in this._sensors
                        let sensorsPaths = this._sensors.map((s, index, array) => { return s["pathToValue"]; })
                        let sIdx = sensorsPaths.indexOf(`${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`);
                        if (sIdx != -1) {
                            sensor["IP"] = modules[moduleID]["IP"];
                            sensor["pathToValue"] = `${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`;
                            this._sensors[sIdx] = sensor;
                        }
                        this.changes.push({ type: ChangeMessageTypes.REPLACED, level: DevicesTypes.SENSOR, data: { ip: modules[moduleID]["IP"], oldInput: localSensor.input.toString(), newInput: sensor.input.toString(), type: sensors[sensorID].type.toString() } });
                    }
                }

                // check devices
                const devices = modules[moduleID]["OUT"];
                const localDevices = (localModules && localModules[moduleID]) ? localModules[moduleID]["OUT"] : undefined;
                for (const deviceID in devices) {
                    const device = (devices) ? devices[deviceID] : undefined;
                    const localDevice = (localDevices) ? localDevices[deviceID] : undefined;
                    if (!localDevice || (device.value != localDevice.value)
                        || (device.output != localDevice.output)
                        || (device.type != localDevice.type)) { // Device was added (send "new" value to ESP) OR Device value changed OR pin changed
                        let output = (device.type == "analog") ? "A" : "D"; //Map device type (analog/digital) and output pin number to *TYPE*PIN_NUMBER* (eg. A5, D2...)
                        output += device.output.toString().substring(1);
                        let val = Number.parseInt(devices[deviceID].value);
                        if (device.type == "analog") {
                            if (val < 50) {
                                val = 0;
                                output = "D" + output.substring(1);
                            }
                            if (val > 950) {
                                val = 1023;
                                output = "D" + output.substring(1);
                            }
                        }
                        this.changes.push({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, data: { ip: modules[moduleID]["IP"], output: output, value: val.toString() } });
                    }
                }
            }
        }

        //Compare local saved DB with received in order to detect removed things
        for (const localRoomID in localRooms) {
            const room = (newRooms) ? newRooms[localRoomID] : undefined;
            if (!room) { // ROOM was removed
                this.changes.push({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.ROOM, data: { path: localRoomID } });
            }
            const localRoom = (localRooms) ? localRooms[localRoomID] : undefined;
            const modules = (room) ? room["devices"] : undefined;
            const localModules = (localRoom) ? localRoom["devices"] : undefined;
            for (const localModuleID in localModules) {
                const module = (modules) ? modules[localModuleID] : undefined;
                if (!module) { // MODULE was removed
                    this.changes.push({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.MODULE, data: { ip: localModules[localModuleID].IP } });
                }
                const localModule = (localModules) ? localModules[localModuleID] : undefined;
                const sensors = (module && module["IN"]) ? module["IN"] : undefined;
                const localSensors = (localModule && localModule["IN"]) ? localModule["IN"] : undefined;
                for (const localSensorID in localSensors) {
                    const sensor = (sensors) ? sensors[localSensorID] : undefined;
                    if (!sensor) {// SENSOR was removed
                        //find old sensor in this._sensors and remove it
                        let sensorsPaths = this._sensors.map((s, index, array) => { return s["pathToValue"]; })
                        let sIdx = sensorsPaths.indexOf(`${firebase.auth().currentUser.uid}/rooms/${localRoomID}/devices/${localModuleID}/IN/${localSensorID}/value`);
                        if (sIdx != -1) {
                            this._sensors.splice(sIdx, 1);
                        }

                        this.changes.push({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.SENSOR, data: { ip: localModule.IP, input: localSensors[localSensorID].input.toString() } });

                    }
                }

                const devices = (module && module["OUT"]) ? module["OUT"] : undefined;
                const localDevices = (localModule && localModule["OUT"]) ? localModule["OUT"] : undefined;
                for (const localDeviceID in localDevices) {
                    const device = (devices) ? devices[localDeviceID] : undefined;
                    if (!device) {// DEVICE was removed
                        this.changes.push({ type: ChangeMessageTypes.REMOVED, level: DevicesTypes.DEVICE, data: { ip: localModule.IP, output: localDevices[localDeviceID].output.toString() } });
                    }
                }
            }
        }

        /*Následně se získá rozdíl nových dat (z Firebase databáze) oproti starým (lokálním).
        Všechny změny se uloží lokálně, čímž se this._dbFile srovná s daty ve Firebase databázi*/
        let diffs = odiff(this.readFromLocalDB("/"), data); // Získáme rozdíl nových dat oproti starým
        diffs.forEach((diff, index, array) => {
            if (diff.type == "set") {
                let pathArr = diff.path;
                let path = diff.path.join("/");
                let val = objectPath.get(data, pathArr);
                let time = (data.lastWriteTime) ? data.lastWriteTime : Date.now();
                this.writeToLocalDB(path, val, time);
            } else if (diff.type == "unset") {
                let pathArr = diff.path;
                let path = diff.path.join("/");
                let time = (data.lastWriteTime) ? data.lastWriteTime : Date.now();
                this.removeInLocalDB(path, time);
            } else {
                console.log("Neznámý typ rozdílu nových dat z databáze...!");
            }
        })
    }

    /**
     * Funkce zpracuje změny, které přišli z Firebase databáze.
     * Změny byli uloženy ve funkci this._checkDbChange(), ve které se uložili do vlastnosti this.changes (tyto změny mají formát objektu typu IChangeMessage)
     */
    private _processDbChanges(): void {
        for (let i = 0; i < this.changes.length; i++) {
            let change = this.changes[i];

            let index = this.changes.indexOf(change);
            this.changes.splice(index, 1); // Změna se odstraní, aby se znovu nezpracovávala

            if (change.level == DevicesTypes.ROOM) { // ZMĚNA NA ÚROVNI MÍSTNOSTI
                if (change.type == ChangeMessageTypes.REMOVED) {// ROOM was removed => reset all modules from that room...
                    //TODO: remove all modules on removing non-empty room
                }
            } else if (change.level == DevicesTypes.MODULE) { // ZMĚNA NA ÚROVNI MODULU
                if (change.type == ChangeMessageTypes.ADDED) {// Module was added => init communication
                    this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                        this._communicationManager.sendESPItsID(espIP, change.data.id);
                        this.clientUpdateInDB({ path: change.data.path, data: { IP: espIP, type: boardType } })
                        //this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP, type: boardType });
                        console.log('SUCC.......change.data.id: ', change.data.id);
                    }).catch((err) => {
                        console.log('ERR.......initCommunicationWithESP err: ', err, "deleting: " + change.data.path);
                        this.clientRemoveFromDB({ path: change.data.path });
                        //this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).remove();
                    })
                } else if (change.type == ChangeMessageTypes.REMOVED) {// Module was removed => reset module...
                    if (change.data.ip)
                        this._communicationManager.resetModule(change.data.ip);
                }
            } else if (change.level == DevicesTypes.SENSOR) { // ZMĚNA NA ÚROVNI SNÍMAČE
                if (change.type == ChangeMessageTypes.ADDED) {// Snímač byl přidán => je potřeba, aby modul naslouchal novým hodnotám na daném vstupu
                    this._communicationManager.ObserveInput(change.data.ip, change.data.input)
                        .catch((err) => {
                            console.log('listenTo err', err);
                        });
                } else if (change.type == ChangeMessageTypes.REPLACED) {// Sensor was added => listen to new values
                    this._communicationManager.changeObservedInput(change.data.ip, change.data.oldInput, change.data.newInput);
                } else if (change.type == ChangeMessageTypes.REMOVED) {
                    this._communicationManager.stopInputObservation(change.data.ip, change.data.input).catch((err) => {
                        console.log('stopInputObservation err: ', err);

                    })
                }
            } else if (change.level == DevicesTypes.DEVICE) { // ZMĚNA NA ÚROVNI ZAŘÍZENÍ
                if (change.type == ChangeMessageTypes.VALUE_CHANGED) {
                    console.log("change val");
                    if (change.data.ip && change.data.output && (change.data.value || change.data.value == 0))
                        this._communicationManager.putVal(change.data.ip, change.data.output, change.data.value);
                } else if (change.type == ChangeMessageTypes.REMOVED) {
                    //nothing needs to be done.
                }
            }

        }
    }

    obj = {
        "lastTime": 1618061300693,
        "rooms": {
            "-MXh9fF2JDmXtkDwyovw": {
                "devices": {
                    "-MXsE0516wQITHvRxiWp": {
                        "IP": "192.168.1.8",
                        "OUT": {
                            "-MXsE1HNRkXZHurxp0QH": {
                                "icon": "light",
                                "index": 0,
                                "name": "Zařízení 7SYK",
                                "output": "D4",
                                "type": "digital",
                                "value": 0
                            }
                        },
                        "index": 0,
                        "name": "Modul MJQV",
                        "type": "NodeMCU"
                    }
                },
                "img": {
                    "offset": 0,
                    "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg"
                },
                "index": 1,
                "name": "Pracovna"
            },
            "-MXs0hQBRQMVjh3dWWez": {
                "img": {
                    "offset": 0,
                    "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg"
                },
                "index": 0,
                "name": "Místnost UCX6"
            }
        }
    }

    clientDBListeners: Array<{ path, res }> = new Array();
    addClientDBListener(path: string, res: any) {
        path = this.correctPath(path);


        this.clientDBListeners.push({
            path: path,
            res: res
        })
        let DBPart = this.getDBPart(path);
        res.write("data: " + JSON.stringify(DBPart) + "\n\n");
        /*setInterval(()=>{
                  
                res.write("data: " + JSON.stringify(obj) + "\n\n")
            },2000)*/
    }

    private correctPath(path: string) {
        path = (path.indexOf("/") == 0) ? path.substring(1) : path;
        path = (path.lastIndexOf("/") == path.length - 1) ? path.substring(0, path.length - 1) : path;
        return path;
    }
    private getDBPart(path: string) {
        let pathArr = this.correctPath(path).split("/");
        let part = this.readFromLocalDB("/");

        for (let i = 0; i < pathArr.length; i++) {
            if (part[pathArr[i]] != undefined) {
                part = part[pathArr[i]];
            } else {
                part = null;
                break;
            }
        }
        return part;
    }

    private readFromLocalDB(path: string, defaultValueIfPathNotExists?: any): any {
        if(path.length == 0 || path == "/"){
            if(this._dbFile){
                return this._dbFile;
            }else{
                return (defaultValueIfPathNotExists == undefined) ? undefined : defaultValueIfPathNotExists;
            }
        }else{
            let pathArr = this.correctPath(path).split("/");
            if (objectPath.has(this._dbFile, pathArr)) {
                return objectPath.get(this._dbFile, pathArr);
            } else {
                return (defaultValueIfPathNotExists == undefined) ? undefined : defaultValueIfPathNotExists;
            }
        }
    }

    public writeToLocalDB(path: string, val: any, time: string | number) {
        if (path.length == 0 || path == "/") {
            path = "/";
            if (val.rooms) {
                let part = this.readFromLocalDB("rooms")
                objectPath.set(this._dbFile, "rooms", merge(part, val.rooms));
            }
        } else {
            let pathArr = this.correctPath(path).split("/");
            let part = this.readFromLocalDB(path);
            if (typeof part == "object" && typeof val == "object") { // Pokud jsou v daném umístění objekty, uložíme deep merge těchto objektů
                objectPath.set(this._dbFile, pathArr, merge(part, val));
            } else { // Jinak prostě nahradíme starou hodnotu novou hodnotou
                objectPath.set(this._dbFile, pathArr, val);
            }
        }
        this._dbFile["lastWriteTime"] = time;

        for (let i = 0; i < this.clientDBListeners.length; i++) {
            if (path.includes(this.clientDBListeners[i].path)) { // Aktualizace je v cestě, na které klient naslouchá
                let DBPart = this.getDBPart(this.clientDBListeners[i].path);
                this.clientDBListeners[i].res.write("data: " + JSON.stringify(DBPart) + "\n\n");
            }
        }
        jsonManager.writeFileSync(dbFilePath, this.readFromLocalDB("/"), { spaces: 2 });
    }

    public removeInLocalDB(path: string, time: string | number) {
        if(path.length == 0 || path == "/"){
            fs.writeFileSync(dbFilePath, '{}');
            this._dbFile["lastWriteTime"] = time;
            jsonManager.writeFileSync(dbFilePath, this.readFromLocalDB("/"), { spaces: 2 });
        }else{
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
    }
    public async clientUpdateInDB(bodyData) {
        let path = this.correctPath(bodyData.path);
        let updates = bodyData.data;

        path = this.correctPath(path);
        let time = Date.now();
        let uid = await this.userUID;
        if (uid && await this.online && await this.firebaseInited) {
            await this._fb.database().ref(uid + "/").update({ lastWriteTime: time });
            await this._fb.database().ref(uid + "/" + path).update(updates);
        } else {
            console.log("zkontrolovat zda není problém s uid");
        }

        this.writeToLocalDB(path, updates, time);

    }

    public async clientPushToDB(bodyData) {
        let path = this.correctPath(bodyData.path);
        let data = bodyData.data;
        let randomKey = "";

        let time = Date.now();

        let uid = await this.userUID;
        if (uid && (await this.online)) {
            await this._fb.database().ref(uid).update({ lastWriteTime: time });
            randomKey = (await this._fb.database().ref().child(uid + "/" + path).push(data)).key;
        } else {
            console.log("zkontrolovat zda není problém s uid!!!!!!!!!!!!!!!");
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
    public async clientGetFromDB(bodyData): Promise<object> {
        let path = this.correctPath(bodyData.path);

        let uid = await this.userUID;
        if (uid && (await this.online) && (await this.firebaseInited)) {
            try {
                let snapshot = await this._fb.database().ref(uid + "/" + path).once('value');
                return snapshot.val();
            } catch (error) {
                return null;
            }
        } else {
            console.log(this._loggedInPromise);
            console.log("zkontrolovat zda není problém s uid!!!!!!!!!!!!!!!");
            return this.getDBPart(path);
        }
    }
    public async clientRemoveFromDB(bodyData) {
        let path = this.correctPath(bodyData.path);

        let time = Date.now();
        let uid = await this.userUID;
        if (uid && (await this.online) && (await this.firebaseInited)) {
            await this._fb.database().ref(uid).update({ lastWriteTime: time });
            await this._fb.database().ref(uid + "/" + path).remove();
        } else {
        }
        this.removeInLocalDB(path, time);
    }


    /**
     * Funkce dle parametru fromFirebase nahradí jednu z databází (lokální nebo Firebase databází) tou druhou.
     * @param fromFirebase Rozhoduje směr kopírování. V případě true se nahradí lokální databáze tou z Firebase databáze.
     * V opačném případě se lokální databáze nahraje do Firebase databáze.
     */
    public async copyDatabase(fromFirebase: boolean) {
        let uid = await this.userUID;
        if (fromFirebase) { // Lokální soubor se přepíše verzí databáze z Firebase
            let snapshot;
            try {
                snapshot = await this._fb.database().ref(uid).once('value');
            } catch (error) {
            }
            let data;
            if (!snapshot) {
                data = {};
            } else {
                data = snapshot.val();
            }
            let time = (data.lastWriteTime)? data.lastWriteTime : Date.now();
            this.removeInLocalDB("/", time);
            if (data.rooms) {
                this.writeToLocalDB("rooms", data.rooms, time);
            }
        } else { // Firebase databáze se přepíše lokálním souborem
            let time = Date.now();
            this._ignoredDBTimes.push(time);
            this.writeToLocalDB("lastWriteTime", time, time);
            await this._fb.database().ref(uid).remove();
            await this._fb.database().ref(uid).update(this.readFromLocalDB("/"));

        }
    }

    private async compareDatabasesAndUpdateOlder() {
        let online = await this.online;
        let inited = await this.firebaseInited;
        if (online || inited || !this.loggedIn) {
            console.log("Není možné porovnat databáze, zařízení není online, nebo nejsou nainicializovány služby firebase, nebo uživatel není přihlášen!");
            return;
        }
    }
}

interface IChangeMessage {
    type: ChangeMessageTypes,
    level: DevicesTypes,
    data?: any
}

enum ChangeMessageTypes {
    REMOVED,
    ADDED,
    REPLACED,
    VALUE_CHANGED,
    CHANGED
}

enum DevicesTypes {
    ROOM,
    MODULE,
    SENSOR,
    DEVICE
}

enum DataSources {
    FIREBASE,
    LOCAL_DATABASE
}