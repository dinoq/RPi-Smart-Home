
var firebase = require('firebase');
const fs = require("fs");
const CommunicationManager = require('./communication-manager.js');
const checkInternetConnected = require('check-internet-connected');
const isOnline = require('is-online');
const editJsonFile = require("edit-json-file");
const jsonManager = require("jsonfile");
const dbFilePath = "db.json";
const objectPath = require("object-path");
const merge = require('deepmerge')

import { SensorInfo, VALUE_TYPE } from "./ESP.js";

export class Firebase {
    private _config;
    private _fb;
    private _firebaseInited = false; // Slouží pro informaci, zda byly již nainicializovány služby Firebase (v případě, že je server spuštěn bez přístupu k internetu, tak je nutné je po připojení k internetu nainicializovat)
    private _dbCopy;
    private _dbFile;

    private _previousOnline = false;
    private _online = false;
    _onlineValidTimeout: number = 1000;
    _lastConnCheck: number = 0;
    connectionCheckInterval: any;

    private _dbInited: boolean = false;
    private _loggedIn: boolean = false;
    private _loggedInResolve;
    private _loggedInPromise;
    private _communicationManager: typeof CommunicationManager;
    private _sensors: Array<any> = new Array();

    private _sensorsUpdates: object = {};
    private _updateSensorsInDBTimeout: any = undefined;
    private _loginInfo: { username: string; pwd: string; };

    private _ignoredDBTimes = new Array(); // Obsahuje časy aktualizací z databáze, které jsou serverem ignorovány (protože změnu způsobuje sám, nechce tedy změny znovu zpracovávat)

    public get loggedIn(): boolean {
        return this._loggedIn;
    }

    changes: IChangeMessage[] = new Array();

    constructor() {
        let obj={
            q:{
                w:{
                    e: 5,
                    p: "AS"
                },
                "R": 47
            },
            p:{
                OP:{
                    WE:5
                }
            }
        }

        objectPath.del(obj, ["q", "w"]); 
        console.log(obj);

        let q = {
            "img": {
              "offset": 0,
              "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg"
            },
            "index": 2,
            "name": "Místnost UANS"
          }
          objectPath.set(q, ["img"], {
            "offset": 20,
            "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg"
          });
          objectPath.del(q, ["q", "w"]); 
          console.log(q);

          let f = 
          {
            "rooms": {
                "-MYBqnLbRdyaQOdxYyWQ": {
                  "index": 0,
                  "img": {
                    "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg",
                    "offset": 0
                  },
                  "name": "Místnost GIF5"
                },
                "-MYBqnLbRdyadfgQOdxYyWQ": {
                  "index": 1,
                  "img": {
                    "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg",
                    "offset": 0
                  },
                  "name": "Místnost GIF5"
                }
            },
            "lastWriteTime": 1618345250659
          }
          
          let change = {
            "img": {
                "src": "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg",
                "offset": 0
            },
            "name": "Místnost GIF5"
      };
      let part = objectPath.get(f, ["rooms", "-MYBqnLbRdyaQOdxYyWQ"]);
      let v = merge(part, change);
          objectPath.set(f, ["rooms", "-MYBqnLbRdyaQOdxYyWQ"], v);
          console.log(f);



        this._loggedInPromise = new Promise((resolve, reject) => { this._loggedInResolve = resolve; });
        this._config = editJsonFile("config.json", {
            autosave: true
        });

        this._communicationManager = new CommunicationManager();
        this._dbFile = jsonManager.readFileSync(dbFilePath);

        this.online.then((online) => {
            if (online) {
                this.initFirebase();
            } else {

            }
        })
        this.connectionCheckInterval = setInterval(async () => {
            let online = await this.online;
            let fbInited = await this.firebaseInited;

            if (!this.loggedIn && online && this._loginInfo) {
                this.login(this._loginInfo.username, this._loginInfo.pwd);
            }

            if (this.loggedIn) {
                let uid = this._fb.auth().currentUser.uid;
                if (!online && this._previousOnline) { // Stav se změnil z online na offline
                    console.log("Server přechází do režimu offline!");
                    this._fb.database().ref(uid).off(); // Je potřeba odstranit posluchače na změnu databáze

                } else if (online && !this._previousOnline) { //Stav se změnil z offline na online
                    console.log("Server opět v režimu online!");
                    this._fb.database().ref(uid).on('value', (snapshot) => {
                        console.log("update z firebase");
                        const data = snapshot.val();
                        this._databaseUpdatedHandler(data);
                    });
                }
            }


            this._previousOnline = online;
        }, this._onlineValidTimeout)
    }

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

    public get userUID(): Promise<string> {
        return this.firebaseInited.then((firebaseInited) => {
            return this.online.then((online) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(null) }, 5000);
                    return this._loggedInPromise.then((value) => {
                        resolve(firebase.auth().currentUser.uid);
                    })

                })
            })
        })
    }

    public login(username: string, pwd: string) {
        this._loginInfo = { username: username, pwd: pwd }

        this.firebaseInited.then((inited) => {
            if (inited) {
                firebase.auth().signInWithEmailAndPassword(username, pwd)
                    .then((user) => {
                        console.log("Uživatel byl úspěšně ověřen, server pracuje.");

                        //this.debugApp();

                        this._loggedInResolve();
                        this._loggedIn = true;
                        this._fb.database().ref(user.user.uid).on('value', (snapshot) => {
                            console.log("update z firebase");
                            const data = snapshot.val();
                            this._databaseUpdatedHandler(data);
                        });
                        this._communicationManager.initCoapServer(this._CoAPIncomingMsgCallback);


                    }).catch((error) => {
                        if (error.code === "auth/network-request-failed") {
                            console.log("Chyba připojení k internetu. Server bude pracovat v lokální síti.");
                        } else {
                            console.log("Neznámá chyba: " + error.message + "\nAplikace se ukončí...");
                            process.exit(5);
                        }
                    });
            } else {
                console.log("Chyba přihlášení k firebase");
            }
        })
    }

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
            const rooms = (this._dbCopy && this._dbCopy["rooms"]) ? this._dbCopy["rooms"] : undefined;
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

    private _databaseUpdatedHandler(data: any) {
        if (data && this._ignoredDBTimes.includes(data.lastWriteTime)) {
            /*let index = this._ignoredDBTimes.indexOf(data.lastWriteTime);
            this._ignoredDBTimes.splice(index, 1);*/
            return;
        }
        if (!this._dbInited) {
            this.initLocalDB(data);
            this.getSensors(data);
        } else {
            this._checkDbChange(data);
            this._processDbChanges();
        }
    }

    initFirebase() {
        if (!this._firebaseInited) {
            this._firebaseInited = true;
            this._fb = firebase.initializeApp({
                apiKey: "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
                authDomain: "home-automation-80eec.firebaseapp.com",
                databaseURL: "https://home-automation-80eec.firebaseio.com",
                projectId: "home-automation-80eec",
                storageBucket: "home-automation-80eec.appspot.com",
                messagingSenderId: "970359498290",
                appId: "1:970359498290:web:a43e83568b9db8eb783e2b",
                measurementId: "G-YTRZ79TCJJ"
            });
        }
    }

    initLocalDB(data) {
        if (!fs.existsSync('db.json')) {// local database file doesn't exist => create it!

        }
        //fs.writeFileSync(this._config.get("db_file_path") || "db.json", JSON.stringify(data));
        this._dbCopy = data;
        this._dbInited = true;

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
            if (this._dbCopy) { // everything was deleted
                //TODO (resetovat všechny moduly atd...)
                this._dbCopy = undefined;
            }
            return
        }

        // check rooms
        const newRooms = (data) ? data["rooms"] : undefined;
        const localRooms = (this._dbCopy) ? this._dbCopy["rooms"] : undefined;
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
        this._dbCopy = data;
    }

    private _processDbChanges(): void {
        for (let i = 0; i < this.changes.length; i++) {
            let change = this.changes[i];

            let index = this.changes.indexOf(change);
            this.changes.splice(index, 1); // Remove change

            if (change.level == DevicesTypes.ROOM) { // ROOM LEVEL CHANGES
                if (change.type == ChangeMessageTypes.REMOVED) {// ROOM was removed => reset all modules from that room...
                    //TODO: remove all modules on removing non-empty room
                }
            } else if (change.level == DevicesTypes.MODULE) { // MODULE LEVEL CHANGES
                if (change.type == ChangeMessageTypes.ADDED) {// Module was added => init communication
                    this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                        this._communicationManager.sendESPItsID(espIP, change.data.id);
                        this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP, type: boardType });
                        console.log('change.data.id: ', change.data.id);
                    }).catch((err) => {
                        console.log('initCommunicationWithESP err: ', err, "deleting: " + change.data.path);
                        this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).remove();
                    })
                } else if (change.type == ChangeMessageTypes.REMOVED) {// Module was removed => reset module...
                    if (change.data.ip)
                        this._communicationManager.resetModule(change.data.ip);
                }
            } else if (change.level == DevicesTypes.SENSOR) { // SENSOR LEVEL CHANGES
                if (change.type == ChangeMessageTypes.ADDED) {// Sensor was added => listen to new values
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
            } else if (change.level == DevicesTypes.DEVICE) { // DEVICE LEVEL CHANGES
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
        let part = this._dbFile;

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

    private readFromLocalDB() {
        this._dbFile = jsonManager.readFileSync(dbFilePath);
        return this._dbFile;
    }

    public writeToLocalDB(path: string, val: any, time: string | number) {
        this.readFromLocalDB();
        let pathArr = this.correctPath(path).split("/");
        
        let part = objectPath.get(this._dbFile, pathArr);
        objectPath.set(this._dbFile, pathArr, merge(part, val));
        this._dbFile["lastWriteTime"] = time;

        jsonManager.writeFileSync(dbFilePath, this._dbFile, { spaces: 2 });
    }

    public removeInLocalDB(path: string, time: string | number) {
        let pathArr = this.correctPath(path).split("/");
        /*let tmp = this._dbFile;
        for(let i = 0; i < pathArr.length; i++){
            if(tmp[pathArr[i]] == undefined){
                break;
            }
            tmp = tmp[pathArr[i]];
        }*/
        /*let part = undefined;
        for (let i = pathArr.length - 2; i >= 0; i--) {
            let tmpObj = {};
            tmpObj[pathArr[i]] = part;
            part = tmpObj;
        }
        this._dbFile[pathArr[0]] = part;*/

        this.readFromLocalDB();
        
        objectPath.del(this._dbFile, pathArr); 
        this._dbFile["lastWriteTime"] = time;
        console.log("after local delete:");
        console.log(this._dbFile);
        jsonManager.writeFileSync(dbFilePath, this._dbFile, { spaces: 2 });

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

        for (let i = 0; i < this.clientDBListeners.length; i++) {
            if (path.includes(this.clientDBListeners[i].path)) { // Aktualizace je v cestě, na které klient naslouchá
                let DBPart = this.getDBPart(this.clientDBListeners[i].path);
                this.clientDBListeners[i].res.write("data: " + JSON.stringify(DBPart) + "\n\n");
            }
        }
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
        this.writeToLocalDB(path+"/"+randomKey, data, time);
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
    public async clientDeleteFromDB(bodyData) {
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


    public async copyDatabase(fromFirebase: boolean) {
        let uid = this._fb.auth().currentUser.uid;
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
            this._dbFile.unset("lastWriteTime");
            this._dbFile.unset("rooms");
            if (data.rooms) {
                this._dbFile.set("rooms", data.rooms);
            }
            if (data.lastWriteTime) {
                this._dbFile.set("lastWriteTime", data.lastWriteTime);
            }


        } else { // Firebase databáze se přepíše lokálním souborem
            let time = Date.now();
            this._ignoredDBTimes.push(time);
            await this._fb.database().ref(uid).remove();
            this._dbFile.set("lastWriteTime", time);
            await this._fb.database().ref(uid).update(this._dbFile.get());

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