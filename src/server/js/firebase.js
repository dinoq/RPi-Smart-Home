var firebase = require('firebase');
const fs = require("fs");
const conf = require("../config.json");
const WifiManager = require('./wifi-manager.js');
module.exports = class Firebase {
    constructor() {
        this._dbInited = false;
        this._loggedIn = false;
        this.changes = new Array();
        this.initFirebase();
        this._wifiManager = new WifiManager();
    }
    get loggedIn() {
        return this._loggedIn;
    }
    login(username, pwd) {
        firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user) => {
            this._loggedIn = true;
            this._fb.database().ref("/Ay9EuCEgoGOZYhFApXU2jczd0X32").on('value', (snapshot) => {
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
            const localmodules = localRoom["devices"];
            for (const moduleID in modules) {
                const sensors = modules[moduleID]["IN"];
                const localSensors = localmodules[moduleID]["IN"];
                for (const sensorID in sensors) {
                }
                const devices = modules[moduleID]["OUT"];
                const localDevices = localmodules[moduleID]["OUT"];
                for (const deviceID in devices) {
                    if (devices[deviceID].value != localDevices[deviceID].value) {
                        this.changes.push({ type: ChangeMessageTypes.VALUE_CHANGED, level: DevicesTypes.DEVICE, value: devices[deviceID].value });
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
                this.changes.push({ type: ChangeMessageTypes.DELETED, level: DevicesTypes.ROOM, value: { path: localRoomID } });
            }
        }
        for (const roomID of newRoomsIDs) {
            this.changes.push({ type: ChangeMessageTypes.ADDED, level: DevicesTypes.ROOM, value: { path: roomID } });
            newRoomsIDs.splice(newRoomsIDs.indexOf(roomID), 1);
        }
        console.log('zustalo: ', newRoomsIDs);
        this._dbCopy = data;
        return this.changes;
    }
    _processDbChanges() {
        console.log("process");
        for (let i = 0; i < this.changes.length; i++) {
            let change = this.changes[i];
            if (change.type == ChangeMessageTypes.ADDED && change.level == DevicesTypes.MODULE) { // Module was added => init communication
                console.log("Module added!");
                this._wifiManager.initCommunicationWithESP().then((value) => {
                    let index = this.changes.indexOf(change);
                    this.changes.splice(index, 1); // Remove change
                });
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
