import { Singleton } from "./singleton.js";
export class Firebase extends Singleton {
    constructor() {
        super();
        this.loggedIn = false;
        this.uid = undefined;
        this.authInited = new Promise((resolve, reject) => { this.resolveAuthInited = resolve; });
        this.database = firebase.database();
        this.auth = firebase.auth();
        console.log("firebase|" + (16179879960 - Math.round(new Date().getTime() / 100)));
        this.auth.onAuthStateChanged((user) => {
            console.log("Až ted|" + (16179879960 - Math.round(new Date().getTime() / 100)));
            this.resolveAuthInited(user);
            if (user) {
                console.log("in|" + (16179879960 - Math.round(new Date().getTime() / 100)));
                this.loggedIn = true;
                this.uid = user.uid;
            }
            else {
                console.log("out|" + (16179879960 - Math.round(new Date().getTime() / 100)));
                this.loggedIn = false;
                this.uid = null;
                this.auth.signOut();
            }
        });
    }
    static getInstance() {
        return super.getInstance();
    }
    static login(username, pwd, persistence = AuthPersistence.LOCAL) {
        return new Promise((resolve, reject) => {
            let fb = Firebase.getInstance();
            fb.auth.setPersistence(firebase.auth.Auth.Persistence[AuthPersistence[persistence]])
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
    static register(username, pwd) {
        let fb = Firebase.getInstance();
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
    static async logout() {
        let fb = Firebase.getInstance();
        fb.loggedIn = false;
        fb.uid = null;
        await fb.auth.signOut();
    }
    static async loggedIn() {
        let fb = Firebase.getInstance();
        await fb.authInited;
        return fb.loggedIn;
    }
    static async getFullPath(dbPath) {
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let slash = (path.lastIndexOf("/") == path.length - 1) ? "" : "/";
        let fb = Firebase.getInstance();
        while (!fb.uid) {
            await (new Promise(resolve => setTimeout(resolve, 100)));
        }
        return fb.uid + path + slash;
    }
    static async addDBListener(dbPath, callback) {
        let dbReference = firebase.database().ref(await Firebase.getFullPath(dbPath));
        dbReference.on('value', (snapshot) => {
            const data = snapshot.val();
            callback(data);
        });
        return dbReference;
    }
    static getDBData(dbPath) {
        return new Promise((resolve, reject) => {
            Firebase.getFullPath(dbPath).then((fullPath) => {
                firebase.database().ref(fullPath).once('value')
                    .then((snapshot) => {
                    resolve(snapshot.val());
                })
                    .catch((value) => {
                    reject(new Error("Error in Firebase.getDBData()"));
                });
            });
        });
    }
    static updateDBData(dbPath, updates) {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref(fullPath).update(updates);
        });
    }
    static deleteDBData(dbPath) {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref(fullPath).remove();
        });
    }
    static pushNewDBData(dbPath, data) {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref().child(fullPath).push(data);
        });
    }
}
export var AuthPersistence;
(function (AuthPersistence) {
    AuthPersistence[AuthPersistence["LOCAL"] = 0] = "LOCAL";
    AuthPersistence[AuthPersistence["SESSION"] = 1] = "SESSION";
    AuthPersistence[AuthPersistence["NONE"] = 2] = "NONE";
})(AuthPersistence || (AuthPersistence = {}));
