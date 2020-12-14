import { Singleton } from "./singleton.js";

export declare var firebase: any;
export class Firebase extends Singleton {
    private loggedIn: boolean;
    database: any;
    auth: any;
    constructor() {
        super();
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.loggedIn = (localStorage.getItem("logged") === "true");
    }

    public static getInstance() {
        return <Firebase>super.getInstance();
    }

    static async login(username, pwd) {
        let result = null;
        await firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user: any) => {
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

    static addDBListener(dbPath: string, callback) {
        console.log('register dbPath: ', dbPath);
        let dbReference = firebase.database().ref(dbPath);
        dbReference.on('value', (snapshot) => {
            console.log("Path changed: ", dbPath);
            const data = snapshot.val();
            callback(data);
        });
    }

    static getDBData(dbPath: string) {
        return firebase.database().ref(dbPath).once('value').then((snapshot) => {

        });
    }
}

