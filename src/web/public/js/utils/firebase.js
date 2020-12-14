import { Singleton } from "./singleton.js";
export class Firebase extends Singleton {
    constructor() {
        super();
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.loggedIn = (localStorage.getItem("logged") === "true");
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
        console.log('register dbPath: ', dbPath);
        let dbReference = firebase.database().ref(dbPath);
        dbReference.on('value', (snapshot) => {
            console.log("Path changed: ", dbPath);
            const data = snapshot.val();
            callback(data);
        });
    }
    static getDBData(dbPath) {
        return firebase.database().ref(dbPath).once('value').then((snapshot) => {
        });
    }
}
