import { Singleton } from "./singleton.js";

export declare var firebase: any;
export class Firebase extends Singleton {
    private loggedIn: boolean = false;
    database: any;
    auth: any;
    uid: any = undefined;
    constructor() {
        super();
        this.database = firebase.database();
        this.auth = firebase.auth();
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.loggedIn = true;
                localStorage.setItem("logged", "true");
                this.uid = user.uid;
            } else {
                localStorage.removeItem("logged");
                this.loggedIn = false;
                this.uid = null;
                this.auth.signOut();
            }
        });
        this.loggedIn = (localStorage.getItem("logged") === "true");
    }

    public static getInstance() {
        return <Firebase>super.getInstance();
    }

    static login(username, pwd) {
        let fb = Firebase.getInstance();
        return new Promise((resolve, reject) => {
            firebase.auth().signInWithEmailAndPassword(username, pwd)
            .then((user: any) => {
                localStorage.setItem("logged", "true");
                fb.uid = user.uid;
                fb.loggedIn = true;
                resolve(user);

            }).catch((error) => {
                localStorage.removeItem("logged");
                fb.uid = undefined;
                fb.loggedIn = false;
                reject(error);
            });

        })
    }

    static register(username, pwd) {
        let fb = Firebase.getInstance();
        return new Promise((resolve, reject) => {
            firebase.auth().createUserWithEmailAndPassword(username, pwd)
                .then((userCredential: any) => {
                    console.log('userCredential: ', userCredential);
                    localStorage.setItem("logged", "true");
                    fb.uid = userCredential.user.uid;
                    fb.loggedIn = true;
                    resolve(userCredential);
    
                }).catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    localStorage.removeItem("logged");
                    fb.uid = undefined;
                    fb.loggedIn = false;
                    reject(error);
                });
        })
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

    static async getFullPath(dbPath: string) {//Adds uid/ at start of dbPath parameter
        let path = (dbPath.indexOf("/") == 0) ? dbPath : "/" + dbPath;
        let slash = (path.lastIndexOf("/") == path.length - 1) ? "" : "/";
        let fb = Firebase.getInstance();
        while (!fb.uid) {
            await (new Promise(resolve => setTimeout(resolve, 100)));
        }
        return fb.uid + path + slash;
    }

    static async addDBListener(dbPath: string, callback) {
        let dbReference = firebase.database().ref(await Firebase.getFullPath(dbPath));
        dbReference.on('value', (snapshot) => {
            const data = snapshot.val();
            callback(data);
        });
        return dbReference;

    }

    static getDBData(dbPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            Firebase.getFullPath(dbPath).then((fullPath) => {
                firebase.database().ref(fullPath).once('value')
                    .then((snapshot) => {
                        resolve(snapshot.val());
                    })
                    .catch((value) => {
                        reject(new Error("Error in Firebase.getDBData()"));
                    })
            })
        })
    }

    static updateDBData(dbPath: string, updates: object): Promise<any> {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref(fullPath).update(updates);
        })
    }

    static deleteDBData(dbPath: string): Promise<any> {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref(fullPath).remove();
        })
    }

    static pushNewDBData(dbPath: string, data: object): Promise<any> {
        return Firebase.getFullPath(dbPath).then((fullPath) => {
            return firebase.database().ref().child(fullPath).push(data);
        })
    }

}

