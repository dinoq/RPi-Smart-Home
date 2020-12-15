import { Singleton } from "./singleton.js";
export class Firebase extends Singleton {
    constructor() {
        super();
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.loggedIn = (localStorage.getItem("logged") === "true");
        this.uid = localStorage.getItem("uid");
    }
    static getInstance() {
        return super.getInstance();
    }
    static async login(username, pwd) {
        let result = null;
        await firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user) => {
            localStorage.setItem("logged", "true");
            localStorage.setItem("remember", "true");
            localStorage.setItem("login", username);
            localStorage.setItem("password", pwd);
            localStorage.setItem("uid", firebase.auth().currentUser.uid);
            return Promise.resolve(user);
        }).catch((error) => {
            return Promise.reject(error);
            //throw new Error(error.code);
        });
    }
    static loggedIn() {
        return Firebase.getInstance().loggedIn;
    }
    static addDBListener(dbPath, callback) {
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let dbReference = firebase.database().ref(Firebase.getInstance().uid + path);
        dbReference.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data)
                callback(data);
        });
    }
    static getDBData(dbPath) {
        return firebase.database().ref(dbPath).once('value').then((snapshot) => {
        });
    }
}
