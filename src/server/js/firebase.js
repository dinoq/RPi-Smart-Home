var firebase = require('firebase');
const fs = require("fs");
const conf = require("../config.json");
const WifiManager = require('./wifi-manager.js');
const CommunicationManager = require('./communication-manager.js');
module.exports = class Firebase {
    constructor() {
        this._dbInited = false;
        this._loggedIn = false;
        this._sensors = new Array();
        this._sensorValueTimeoutTime = 20000;
        this.changes = new Array();
        this._updateSensorsValues = async () => {
            const updates = {};
            for (let i = 0; i < this._sensors.length; i++) {
                const sensor = this._sensors[i];
                if (sensor.IP) {
                    //console.log('sensor: ', sensor);
                    let newVal;
                    try {
                        if (sensor.type == "bus") { // BMP returns float
                            newVal = Number.parseFloat(await this._communicationManager.getVal(sensor.IP, sensor.input));
                        }
                        else {
                            newVal = Number.parseInt(await this._communicationManager.getVal(sensor.IP, sensor.input));
                        }
                        //console.log('newVal: ', newVal);
                        if (newVal != sensor.value) {
                            sensor.value = newVal;
                            updates[sensor.pathToValue] = newVal;
                            updates[sensor.pathToValue] = newVal;
                        }
                    }
                    catch (error) {
                    }
                }
            }
            console.log("___________________");
            //update in Database
            await firebase.database().ref().update(updates);
            this._sensorValueTimeout = setTimeout(this._updateSensorsValues, this._sensorValueTimeoutTime);
        };
        this.initFirebase();
        this._wifiManager = new WifiManager();
        this._communicationManager = new CommunicationManager();
    }
    get loggedIn() {
        return this._loggedIn;
    }
    login(username, pwd) {
        firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user) => {
            console.log("Succesfully logged in");
            this._loggedIn = true;
            this._fb.database().ref(user.user.uid).on('value', (snapshot) => {
                const data = snapshot.val();
                this._databaseUpdatedHandler(data);
            });
        }).catch((error) => {
            console.log('error user: ', error);
        });
    }
    _databaseUpdatedHandler(data) {
        if (!this._dbInited) {
            this.initLocalDB(data);
        }
        else {
            console.log(this.saveDbChange(data));
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
        if (!fs.existsSync('db.json')) { // local database file doesn't exist => create it!
        }
        fs.writeFileSync(conf.db_file_path, JSON.stringify(data));
        this._dbCopy = data;
        this._dbInited = true;
        this.getSensors(data);
    }
    getSensors(data) {
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
        this._sensorValueTimeout = setTimeout(this._updateSensorsValues, this._sensorValueTimeoutTime);
    }
    saveDbChange(data) {
        const newRooms = data["rooms"];
        console.log('__________________________________');
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
            }
            else {
                this.changes.push({ type: ChangeMessageTypes.DELETED, level: DevicesTypes.ROOM, data: { path: localRoomID } });
            }
        }
        for (const roomID of newRoomsIDs) {
            this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.ROOM, data: { path: roomID } });
            newRoomsIDs.splice(newRoomsIDs.indexOf(roomID), 1);
        }
        console.log('zustalo: ', newRoomsIDs);
        this._dbCopy = data;
        return this.changes;
    }
    _processDbChanges() {
        for (let i = 0; i < this.changes.length; i++) {
            let change = this.changes[i];
            let index = this.changes.indexOf(change);
            this.changes.splice(index, 1); // Remove change
            if (change.type == ChangeMessageTypes.ADDED && change.level == DevicesTypes.MODULE) { // Module was added => init communication
                this._communicationManager.initCommunicationWithESP().then((espIP) => {
                    console.log("ADD " + espIP + "to" + firebase.auth().currentUser.uid);
                    this._fb.database().ref(firebase.auth().currentUser.uid + "/" + change.data.path).update({ IP: espIP });
                    this._communicationManager.sendESPItsID(change.data.id);
                    console.log('change.data.id: ', change.data.id);
                });
            }
            else if (change.type == ChangeMessageTypes.VALUE_CHANGED && change.level == DevicesTypes.DEVICE) {
                console.log("change val!!!");
                if (change.data.ip && change.data.output && (change.data.value || change.data.value == 0))
                    this._communicationManager.putVal(change.data.ip, change.data.output, change.data.value);
            }
        }
    }
};
var ChangeMessageTypes;
(function (ChangeMessageTypes) {
    ChangeMessageTypes[ChangeMessageTypes["DELETED"] = 0] = "DELETED";
    ChangeMessageTypes[ChangeMessageTypes["ADDED"] = 1] = "ADDED";
    ChangeMessageTypes[ChangeMessageTypes["VALUE_CHANGED"] = 2] = "VALUE_CHANGED";
})(ChangeMessageTypes || (ChangeMessageTypes = {}));
var DevicesTypes;
(function (DevicesTypes) {
    DevicesTypes[DevicesTypes["ROOM"] = 0] = "ROOM";
    DevicesTypes[DevicesTypes["MODULE"] = 1] = "MODULE";
    DevicesTypes[DevicesTypes["SENSOR"] = 2] = "SENSOR";
    DevicesTypes[DevicesTypes["DEVICE"] = 3] = "DEVICE";
})(DevicesTypes || (DevicesTypes = {}));
