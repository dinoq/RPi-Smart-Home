var firebase = require('firebase');
const fs = require("fs");
const conf = require("../config.json");
module.exports = class Firebase {
    constructor() {
        this._dbInited = false;
        this.initFirebase();
        firebase.auth().signInWithEmailAndPassword("marek.petr10@seznam.cz", "Automation123")
            .then((user) => {
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
    }
};
