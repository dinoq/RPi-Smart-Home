import { Singleton } from "./singleton.js";

export declare var firebase: any;
export class Firebase extends Singleton {
    private loggedIn: boolean;
    database: any;
    auth: any;
    uid: any;
    constructor() {
        super();
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.loggedIn = (localStorage.getItem("logged") === "true");
        this.uid = localStorage.getItem("uid");
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

    static addDBListener(dbPath: string, callback) {
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let dbReference = firebase.database().ref(Firebase.getInstance().uid + path);
        dbReference.on('value', (snapshot) => {
            const data = snapshot.val();
            if(data)
                callback(data);
        });

    }

    static getDBData(dbPath: string) {
        return firebase.database().ref(dbPath).once('value').then((snapshot) => {
        });
    }
}

