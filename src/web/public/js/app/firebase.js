import { Singleton } from "./singleton.js";
export class Firebase extends Singleton {
    constructor() {
        super();
        this.loggedIn = false;
        this.uid = undefined;
        this.database = firebase.database();
        this.auth = firebase.auth();
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.loggedIn = true;
                localStorage.setItem("logged", "true");
                this.uid = user.uid;
            }
            else {
                this.loggedIn = false;
            }
        });
        this.loggedIn = (localStorage.getItem("logged") === "true");
    }
    static getInstance() {
        return super.getInstance();
    }
    static async login(username, pwd) {
        let result = null;
        let fb = Firebase.getInstance();
        await firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user) => {
            localStorage.setItem("logged", "true");
            fb.uid = user.uid;
            fb.loggedIn = true;
            return Promise.resolve(user);
        }).catch((error) => {
            localStorage.removeItem("logged");
            fb.uid = undefined;
            fb.loggedIn = false;
            return Promise.reject(error);
        });
    }
    static async logout() {
        localStorage.removeItem("logged");
        let fb = Firebase.getInstance();
        fb.loggedIn = false;
        fb.uid = null;
        await fb.auth.signOut();
    }
    static loggedIn() {
        return Firebase.getInstance().loggedIn;
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
