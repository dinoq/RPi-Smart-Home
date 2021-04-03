
var firebase = require('firebase');
const fs = require("fs");
const conf = require("../config.js");
const CommunicationManager = require('./communication-manager.js');
const ESP = require("./ESP");
const VALUE_TYPE = ESP.VALUE_TYPE;
const SensorInfo = ESP.SInfo;


module.exports = class Firebase {
    private _fb;
    private _dbCopy;
    private _dbInited: boolean = false;
    private _loggedIn: boolean = false;
    private _communicationManager: typeof CommunicationManager;
    private _sensors: Array<any> = new Array();

    private _sensorsUpdates: object = {};
    private _updateSensorsInDBTimeout: any = undefined;

    public get loggedIn(): boolean {
        return this._loggedIn;
    }

    changes: IChangeMessage[] = new Array();

    constructor() {
        this.initFirebase();
        this._communicationManager = new CommunicationManager();
    }

    public login(username: string, pwd: string) {
        firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user) => {
                console.log("Succesfully logged in");

                //this.debugApp();

                this._loggedIn = true;
                this._fb.database().ref(user.user.uid).on('value', (snapshot) => {
                    const data = snapshot.val();
                    this._databaseUpdatedHandler(data);
                });
                this._communicationManager.initCoapServer(this._CoAPIncomingMsgCallback);


            }).catch((error) => {
                console.log('error user: ', error);
            });
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
            /*let val_type = req.payload[req.payload.length - 2];
            let IN = Number.parseInt(req.payload[req.payload.length - 1]) - 1;
            let valStr = req.payload.toString().substring("in:".length, req.payload.length - 2);
            let val;
            if(valStr == "??"){                
                this._updateSensor(new SensorInfo(IN, val_type, valStr), req.rsinfo.address);
            }else{
                if (val_type == VALUE_TYPE.I2C) {
                    val = Number.parseFloat(valStr).toFixed(1);
                } else {
                    val = Number.parseInt(valStr);
                }
                this._updateSensor(new SensorInfo(IN, val_type, val), req.rsinfo.address);
            }*/

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

            if(moduleFoundedInDB){
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
            }else if(this._dbInited){ // Module was probably deleted from database, when module was OFF => reset that module
                this._communicationManager.resetModule(moduleIP);
            }else{ // db was still not inited in server...
                console.log("DB was not still inited in server");
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
        if(moduleFoundedInDB){
            if (!this._updateSensorsInDBTimeout) {
                this._updateSensorsInDBTimeout = setTimeout(this._updateSensorsInDB, 200);
            }            
        }else{ // Module was probably deleted from database, when module was OFF => reset that module
            this._communicationManager.resetModule(moduleIP);
        }
    }

    private _updateSensorsInDB = async () => {
        this._updateSensorsInDBTimeout = undefined;
        if (this._sensorsUpdates && Object.keys(this._sensorsUpdates).length != 0) {
            console.log((Math.floor(Date.now() / 1000) - 1616084626) + '| updates: ', this._sensorsUpdates);
            await firebase.database().ref().update(this._sensorsUpdates);
            this._sensorsUpdates = {};
        }
    }

    private _databaseUpdatedHandler(data: any) {
        if (!this._dbInited) {
            this.initLocalDB(data);
            this.getSensors(data);
        } else {
            this._checkDbChange(data);
            this._processDbChanges();
        }
    }

    initFirebase() {
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

    initLocalDB(data) {
        if (!fs.existsSync('db.json')) {// local database file doesn't exist => create it!

        }
        fs.writeFileSync(conf.db_file_path, JSON.stringify(data));
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
                    if(module.index != undefined){ // If module.index is undefined => module was actually deleted from db and only updated by server with ip and type
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
                        if(device.type == "analog"){
                            if (val < 50){
                                val = 0;
                                output = "D" + output.substring(1);
                            }
                            if (val > 950){
                                val = 1023;
                                output = "D" + output.substring(1);
                            }
                        }
                        this.changes.push({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, data: { ip: modules[moduleID]["IP"], output: output, value:  val.toString()} });
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