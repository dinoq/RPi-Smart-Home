
var firebase = require('firebase');
const fs = require("fs");
const conf = require("../config.js");
const CommunicationManager = require('./communication-manager.js');
const ESP = require("./ESP");
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

                this.debugApp();

                this._loggedIn = true;
                this._fb.database().ref(user.user.uid).on('value', (snapshot) => {
                    const data = snapshot.val();
                    this._databaseUpdatedHandler(data);
                });
                this._communicationManager.initCoapServer(this._updateSensor);


            }).catch((error) => {
                console.log('error user: ', error);
            });
    }

    private debugApp(){
        let debugIP = "192.168.1.8";
        this._communicationManager.resetRPiServer(debugIP); //TODO: delete
        setTimeout(()=>{ 
            let change = JSON.parse("{\"type\":1,\"level\":1,\"data\":{\"id\":\"-MVwvZHnfCbecnYYOtEf\",\"path\":\"rooms/-MVwvYAL2RM_XyOKV4lH/devices/-MVwvZHnfCbecnYYOtEf\"}}");
            this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                console.log("ADD " + espIP + "to" + firebase.auth().currentUser.uid);
                this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP, type: boardType });
                this._communicationManager.sendESPItsID(espIP, change.data.id);
                console.log('change.data.id: ', change.data.id);

                setTimeout(() => { this._communicationManager.ObserveInput(debugIP, "A17").catch((value) => {
                    console.log('err1 value: ', value.message);
                    
                }); }, 2000);
                setTimeout(() => { this._communicationManager.ObserveInput(debugIP, "I2C-SHT21-teplota").catch((value) => {
                    console.log('err2 value: ', value.message);
                    
                }); }, 2000);

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

    private _updateSensor = async (sensorInfo: SensorInfo, moduleIP) => {
        this._sensors.forEach((sensor, index, array) => {
            if (moduleIP == sensor.IP) {
                if (sensorInfo.val != sensor.value
                    && sensorInfo.getInput() == sensor.input) { // If value changed and sensor input record exists in this_sensors, save change to DB
                    this._sensorsUpdates[sensor.pathToValue] = sensorInfo.val;
                }
            }
        })
        if (!this._updateSensorsInDBTimeout) {
            this._updateSensorsInDBTimeout = setTimeout(this._updateSensorsInDB, 1000);
        }
    }

    private _updateSensorsInDB = async () => {
        this._updateSensorsInDBTimeout = undefined;
        if (this._sensorsUpdates && Object.keys(this._sensorsUpdates).length != 0) {
            console.log((Math.floor(Date.now() / 1000)-1616084626)+'| updates: ', this._sensorsUpdates);
            await firebase.database().ref().update(this._sensorsUpdates);
            this._sensorsUpdates = {};
        }
    }

    private _databaseUpdatedHandler(data: any) {
        if (!this._dbInited) {
            this.initLocalDB(data);
        } else {
            this.saveDbChange(data);
            this._processDbChanges();
        }
        this.getSensors(data);
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
    
    saveDbChange(data) {
        const newRooms = data["rooms"];

        let newRoomsIDs = new Array();
        for (const newRoomID in newRooms) {
            newRoomsIDs.push(newRoomID);
            const room = newRooms[newRoomID];
            const localRoom = this._dbCopy["rooms"][newRoomID];
            const modules = room["devices"];
            const localmodules = (localRoom) ? localRoom["devices"] : undefined;
            for (const moduleID in modules) {
                if (!(localmodules && localmodules[moduleID])) { // Module added
                    let path = "rooms/" + newRoomID + "/devices/" + moduleID;
                    console.log('new module path: ', path);
                    this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.MODULE, data: { id: moduleID, path: path } });
                }
                const sensors = modules[moduleID]["IN"];
                const localSensors = (localmodules && localmodules[moduleID]) ? localmodules[moduleID]["IN"] : undefined;
                for (const sensorID in sensors) {
                    if(!(localSensors && localSensors[sensorID])){ // Sensor added
                        this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.SENSOR, data: { ip: modules[moduleID]["IP"], input: sensors[sensorID].input.toString() } });
                        
                        //Add also to sensors in order to update in DB
                        sensors[sensorID]["IP"] = modules[moduleID]["IP"];
                        sensors[sensorID]["pathToValue"] = `${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`;
                        this._sensors.push(sensors[sensorID]);
                    }else{
                        if((sensors[sensorID].input != localSensors[sensorID].input)
                            ||(sensors[sensorID].type != localSensors[sensorID].type)){ // sensor changed => just "delete" (stop listening to) old sensor and add new...
                            //find old sensor in this._sensors
                            let sensorsPaths = this._sensors.map((s, index, array) => {return s["pathToValue"];})
                            let sIdx = sensorsPaths.indexOf(`${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`);
                            if(sIdx != -1){
                                sensors[sensorID]["IP"] = modules[moduleID]["IP"];
                                sensors[sensorID]["pathToValue"] = `${firebase.auth().currentUser.uid}/rooms/${newRoomID}/devices/${moduleID}/IN/${sensorID}/value`;
                                this._sensors[sIdx] = sensors[sensorID];
                            }
                            this.changes.push({ type: ChangeMessageTypes.REPLACED, level: DevicesTypes.SENSOR, data: { ip: modules[moduleID]["IP"], input: sensors[sensorID].input.toString(), type: sensors[sensorID].type.toString() } });
                        
                        }
                    }

                }
                const devices = modules[moduleID]["OUT"];
                const localDevices = (localmodules && localmodules[moduleID]) ? localmodules[moduleID]["OUT"] : undefined;
                for (const deviceID in devices) {
                    if (devices[deviceID].value != localDevices[deviceID].value) {
                        this.changes.push({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, data: { ip: modules[moduleID]["IP"], output: devices[deviceID].output.toString(), value: devices[deviceID].value.toString() } });
                    }
                }
            }
        }

        const localRooms = this._dbCopy["rooms"];
        for (const localRoomID in localRooms) {
            if (newRoomsIDs.includes(localRoomID)) { // New rooms doesn't contain localRoomID from local saved rooms => room was deleted
                newRoomsIDs.splice(newRoomsIDs.indexOf(localRoomID), 1);
            } else {
                this.changes.push({ type: ChangeMessageTypes.DELETED, level: DevicesTypes.ROOM, data: { path: localRoomID } });
            }
        }

        for (const roomID of newRoomsIDs) {
            this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.ROOM, data: { path: roomID } });
            newRoomsIDs.splice(newRoomsIDs.indexOf(roomID), 1);
        }
        //console.log('zustalo: ', newRoomsIDs);


        this._dbCopy = data;
    }

    private _processDbChanges(): void {
        for (let i = 0; i < this.changes.length; i++) {
            let change = this.changes[i];

            let index = this.changes.indexOf(change);
            this.changes.splice(index, 1); // Remove change

            if(change.level == DevicesTypes.MODULE){ // MODULE LEVEL CHANGES
                if (change.type == ChangeMessageTypes.ADDED) {// Module was added => init communication
                    this._communicationManager.initCommunicationWithESP().then(({ espIP, boardType }) => {
                        this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP, type: boardType });
                        this._communicationManager.sendESPItsID(espIP, change.data.id);
                        console.log('change.data.id: ', change.data.id);
                    }).catch((err) => {
                        console.log('err: ', err.message, "deleting: " + change.data.path);    
                        this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).remove();                
                    })
                }
            }else if(change.level == DevicesTypes.SENSOR){ // SENSOR LEVEL CHANGES
                if (change.type == ChangeMessageTypes.ADDED) {// Sensor was added => listen to new values
                    this._communicationManager.ObserveInput(change.data.ip, change.data.input)
                    .catch((err) => {
                        console.log('listenTo err', err.message);
                    });
                } else if (change.type == ChangeMessageTypes.REPLACED) {// Sensor was added => listen to new values
                    this._communicationManager.changeObservedInput(change.data.ip, change.data.input);
                }
            }else if(change.level == DevicesTypes.DEVICE){ // DEVICE LEVEL CHANGES
                if (change.type == ChangeMessageTypes.VALUE_CHANGED) {
                    console.log("change val");
                    if (change.data.ip && change.data.output && (change.data.value || change.data.value == 0))
                        this._communicationManager.putVal(change.data.ip, change.data.output, change.data.value);
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
    DELETED,
    ADDED,
    REPLACED,
    VALUE_CHANGED
}

enum DevicesTypes {
    ROOM,
    MODULE,
    SENSOR,
    DEVICE
}