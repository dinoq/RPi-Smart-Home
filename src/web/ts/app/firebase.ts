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
    static async logout() {
        localStorage.removeItem("logged");
        localStorage.removeItem("remember");
        localStorage.removeItem("login");
        localStorage.removeItem("password");
        localStorage.removeItem("uid");
        Firebase.getInstance().loggedIn = false;
        Firebase.getInstance().uid = null;
    }

    static loggedIn() {
        return Firebase.getInstance().loggedIn;
    }

    static getFullPath(dbPath: string){//Adds uid/ at start of dbPath parameter
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let slash = (path.lastIndexOf("/") == path.length-1)? "": "/";
        return Firebase.getInstance().uid + path + slash;
    }

    static addDBListener(dbPath: string, callback) {
        let dbReference = firebase.database().ref(Firebase.getFullPath(dbPath));
        dbReference.on('value', (snapshot) => {
            const data = snapshot.val();
            if(data)
                callback(data);
        });

    }

    static getDBData(dbPath: string): Promise<any> {
        return new Promise((resolve, reject)=>{
            firebase.database().ref(Firebase.getFullPath(dbPath)).once('value')
            .then((snapshot) => {
                resolve(snapshot.val());
            })
            .catch((value) => {
                reject(new Error("Error in Firebase.getDBData()"));
            })
        }) 
        /**
         * 
        return firebase.database().ref(Firebase.getFullPath(dbPath)).once('value').then((snapshot) => {
            const data = snapshot.val();
            if(data)
                callback(data);
        });
         * 
         */
    }

    static updateDBData(dbPath: string, updates: object): Promise<any> {
        return firebase.database().ref(Firebase.getFullPath(dbPath)).update(updates);
    }

    static deleteDBData(dbPath: string): Promise<any> {
        return firebase.database().ref(Firebase.getFullPath(dbPath)).remove();
    }

    static pushNewDBData(dbPath: string, data: object): Promise<any> {
        return firebase.database().ref().child(Firebase.getFullPath(dbPath)).push(data);
    }

    static pushNewDBDataAndUpdate(dbPath: string, updates: object)/*: { key: string, promise: Promise<any> }*/ {
       /* let k = Firebase.pushNewDBData(dbPath);
        let prom = firebase.database().ref(Firebase.getFullPath(dbPath)+k).update(updates);
        return {
            key: k,
            promise: prom
        };*/
    }
}

