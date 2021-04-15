
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const open = require('open');
const editJsonFile = require("edit-json-file");
const fs = require("fs");
const jsonManager = require("jsonfile");

import { CommunicationManager } from "./communication-manager.js";
import { Firebase } from "./firebase.js";

const configFilePath = "config.json";
const configExampleFilePath = "config.json";

class ServerApp {
    private _app: any = express();
    private _firebase: Firebase;
    private _config: any;
    private _port: any;

    private _serverStartedPromiseResolver;
    private _serverStartedPromise = new Promise((resolve, reject) => { this._serverStartedPromiseResolver = resolve;})

    constructor() {
        if (fs.existsSync(configFilePath)) {// Pokud existuje soubor s konfigurací, načte se
            this._config = jsonManager.readFileSync(configFilePath);
        } else { // V opačném případě se zjišťuje, zda existuje soubor s příkladem konfigurace.
            if (fs.existsSync(configExampleFilePath)) {// Pokud soubor s příkladem konfigurace existuje, vytvoří na jeho základě konfigurační soubor
                this._config = jsonManager.readFileSync(configExampleFilePath);
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            } else {// Pokud ani soubor s příkladem konfigurace neexistuje, vytvoří se programově oba soubory
                this._config = {
                    "webAppPort": 80,
                    "NEW_MODULE_FIND_TIMEOUT": 10000,
                    "username": "",
                    "password": "",
                    "saveUserCredentialsOnLogin": true,
                    "openBrowserToRegister": true,
                    "openBrowserOnStart": true,
                    "firebase": {
                        "apiKey": "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
                        "authDomain": "home-automation-80eec.firebaseapp.com",
                        "databaseURL": "https://home-automation-80eec.firebaseio.com",
                        "projectId": "home-automation-80eec",
                        "storageBucket": "home-automation-80eec.appspot.com",
                        "messagingSenderId": "970359498290",
                        "appId": "1:970359498290:web:a43e83568b9db8eb783e2b",
                        "measurementId": "G-YTRZ79TCJJ"
                    },
                    "debugLevel": 1
                }
                jsonManager.writeFileSync(configExampleFilePath, this._config, { spaces: 2 });
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            }
        }

        this._port = this.getFromConfig("webAppPort", 80);
        
        this._firebase = new Firebase();

        var p = path.join(__dirname, '../../web/public');

        /*this._app.use("/updates", (req, res) => {
            console.log('update...');

            if (this._firebase.loggedIn)
                res.send("I will be served instead of a files directory");
            else
                res.send("Musíte se přihlásit!!!");
        });*/

        this._app.use(bodyParser.json())
        this._app.use(bodyParser.urlencoded({
            extended: true
        }));

        this._app.use((req, res, next) => {
            if (req.url.includes("addDBListener")) {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                })
                let path = (req.query && req.query.path) ? req.query.path : "";
                this._firebase.addClientDBListener(path, res);
            } else {
                next();
            }
        });

        this._app.post('/*', (req, res) => { // '/*' or '/domu'
            /*if(req.get('Referer').includes("uzivatel/login")){ // Logged in
                let username = req.body.login;
                let pwd = req.body.password;
                if(username && pwd)
                    this._firebase.login(username, pwd);
            }
            console.log(req.body)
            console.log("qqqqq",req.url);*/
            if (this.getFromConfig("debugLevel", 0) > 0) {
                console.log("Požadavek od klienta na: " + req.url);
            }
            if (req.url.includes("/updateData")) {
                this._firebase.clientUpdateInDB(req.body).then((value) => {
                    res.sendStatus(200);
                })
            } else if (req.url.includes("/pushData")) {
                this._firebase.clientPushToDB(req.body).then((key) => {
                    console.log('sending key: ', key);
                    res.send(key);
                })
            } else if (req.url.includes("/getData")) {
                this._firebase.clientGetFromDB(req.body).then((data) => {
                    res.send(data);
                })
            } else if (req.url.includes("/deleteData")) {
                this._firebase.clientRemoveFromDB(req.body).then((data) => {
                    res.sendStatus(200);
                })
            } else if (req.url.includes("CopyDatabase")) {
                //CopyDatabaseFromFirebase or CopyDatabaseToFirebase
                console.log("REQ for copying db: " + req.url);
                let fromFirebase = (req.url.includes("CopyDatabaseFromFirebase"));
                this._firebase.copyDatabase(fromFirebase).then((value) => {
                    res.sendStatus(200);
                }).catch((value) => {
                    res.sendStatus(423);
                })
            } else {
                let uName;
                let pwd;
                if (req.header('Referer').includes("login")) {
                    let saveUserCredentialsOnLogin = this.getFromConfig("saveUserCredentialsOnLogin", true);
                    saveUserCredentialsOnLogin = saveUserCredentialsOnLogin == true || saveUserCredentialsOnLogin == "true";
                    if (saveUserCredentialsOnLogin) {
                        uName = (req && req.body) ? req.body["username"] : undefined;
                        pwd = (req && req.body) ? req.body["password"] : undefined;
                    }
                } else if (req.header('Referer').includes("registrace")) {
                    uName = (req && req.body) ? req.body["registration-username"] : undefined;
                    pwd = (req && req.body) ? req.body["registration-pwd"] : undefined;
                }
                if (uName != undefined && pwd != undefined) {
                    this._config["username"] = uName;
                    this._config["password"] = pwd;
                    jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
                    console.log("Přihlašovací údaje uloženy do konfiguračního souboru.");
                    this._firebase.login(uName, pwd);
                }
                res.redirect("http://" + req.hostname + "/domu");
                //res.redirect(req.url);
            }
        });

        let devicePairedWithAccount = this.getFromConfig("username") && this.getFromConfig("username").toString().length
            && this.getFromConfig("password") && this.getFromConfig("password").toString().length;
        this._app.get('/*', (req, res, next) => {
            if (req.url.includes("paired")) {
                res.send({paired: devicePairedWithAccount});
            } else {
                next();
            }
        });
        /*let localStorageCleared = false;
        this._app.use((req, res, next) => {// Clear local storage in order to force login if server is not currently logged in. Must be before static serving...
            console.log('this._firebase.loggedIn: ', this._firebase.loggedIn);
            if (this._firebase.loggedIn || localStorageCleared) {
                next();
            }
            else {
                console.warn("Server is not logged in");
                localStorageCleared = true;
                res.setHeader("Content-Type", "text/html");
                res.write("<script>localStorage.clear();location.reload();</script>");
            }
        });*/
        let portStr = (this._port == 80) ? "" : ":" + this._port;
        if (devicePairedWithAccount) {
            this._firebase.login(this.getFromConfig("username"), this.getFromConfig("password"));
            if(this.getFromConfig("openBrowserOnStart", true)){
                this._serverStartedPromise.then((value) => { // Pokud je v to v configu nastavené (vlastností openBrowserOnStart), otevře se automaticky po startu serveru domovská stránka webové aplikace v internetovém prohlížeči.
                    open('http://localhost' + portStr + '/domu');
                })
            }
        } else {
            console.log("Vypadá to, že server není spárován s žádným uživatelským účtem. Pro spárování je nutné se ze zařízení, na kterém server běží zaregistovat (na http://localhost" + portStr + "/registrace/) či přihlásit (http://localhost" + portStr + "/login/), dříve nebude možné systém ovládat přes internet (mimo lokální síť). K registraci je vyžadováno internetové připojení.");
            console.log("Spárování pomocí přihlášení/registrace je také možné provést z jiného zařízení v lokální síti na adrese: http://" + CommunicationManager.getServerIP() + portStr + "/login/, resp.: http://" + CommunicationManager.getServerIP() + portStr + "/registrace/");
            
            if(this.getFromConfig("openBrowserToRegister", true)){
                this._serverStartedPromise.then((value) => { // Pokud uživatel nemá spárovaný účet, tak po startu serveru otevřít internetový prohlížeš s otevřenou registrací (pokud je toto chování nastavené v configu vlastností openBrowserToRegister)
                    open('http://localhost' + portStr + '/registrace?forceLogout=true');
                })
            }
        }

        this._app.use(express.static(p), (req, res, next) => {
            //console.log("ooo");
            //console.log("client IP:", req.ip);
            next();
        });
        this._app.use('/*', express.static(p), (req, res, next) => {
            //console.log("c");
            next();
        });
        this._app.use((req, res, next) => {
            //console.log("XXX");
            next();
        });
        this._app.use((req, res, next) => {
            //console.log("VVV");
            next();
        });

        /*this.app.use('/*',express.static(p));
        this.app.use("/", function (req, res) {
            console.log("ADFG",req.url);
            res.redirect(req.url);
        });*/
    }

    public start() {
        try{
            let server = this._app.listen(this._port, (err)=>{
                if(err){
                    if(err.code == "EADDRINUSE"){
                        console.error("Zvolený port (" + this._port + ") již využívá jiná aplikace. Zvolte jiný port v souboru server/config.json!");
                        process.exit(5);
                    }else if(err.code == "EACCES"){
                        console.error("Nemáte přístup ke zvolenému portu (" + this._port + "). Zvolte jiný port (s hodnotou > 1023) v souboru server/config.json, nebo spusťe server jako admin (sudo npm start)!");
                        process.exit(5);
                    }else if(err && err.code == "ERR_SOCKET_BAD_PORT"){
                        let tooHighPortNumberMsg = (this._port > 65535)? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                        console.error("Špatně zvolený port (" + this._port + ")!. " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!");
                        process.exit(5);
                    }else{
                        console.error("Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!");
                        process.exit(5);
                    }
                }else{
                    if (this.getFromConfig("debugLevel", 0) > 0) {
                        //console.log("Server běží na portu: " + this.port + ".");
                        let portStr = (this._port == 80) ? "" : ":" + this._port;
                        console.log("Pro přístup k webové aplikaci ze zařízení, na kterém běží server přejděte v internetovém prohlížeči na adresu http://localhost" + portStr);
                        console.log("Pro přístup k webové aplikaci ze jiného zařízení v lokální síti přejděte v internetovém prohlížeči na adresu http://" + CommunicationManager.getServerIP() + portStr);
                        console.log("Pro přístup k webové aplikaci ze jiného zařízení globálně (přes internet) přejděte v internetovém prohlížeči na adresu https://auto-home.web.app/");
                    }
                    this._serverStartedPromiseResolver(); // Resolvne Promise, na kterou se v kódu čeká tam, kde je potřeba aby server už běžel...
                }
            });
            server.on("error", (err)=>{
                if(err && err.code == "EADDRINUSE"){
                    console.error("Zvolený port (" + this._port + ") již využívá jiná aplikace. Zvolte jiný port v souboru server/config.json!");
                    process.exit(5);
                }else if(err && err.code == "EACCES"){
                    console.error("Nemáte přístup ke zvolenému portu (" + this._port + "). Zvolte jiný port (s hodnotou > 1023) v souboru server/config.json, nebo spusťe server jako admin (sudo npm start)!");
                    process.exit(5);
                }else if(err && err.code == "ERR_SOCKET_BAD_PORT"){
                    let tooHighPortNumberMsg = (this._port > 65535)? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                    console.error("Špatně zvolený port (" + this._port + ")!. " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!");
                    process.exit(5);
                }else{
                    console.error("Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!");
                    process.exit(5);
                }
            })
        }catch (err){
            if(err && err.code == "ERR_SOCKET_BAD_PORT"){
                let tooHighPortNumberMsg = (this._port > 65535)? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                console.error("Špatně zvolený port (" + this._port + ")!. " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!");
                process.exit(5);
            }
            console.error("Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!");
            process.exit(5);            
        }
    }

    getFromConfig(property: string, valueIfUndefined?: any) {
        if (this._config && this._config[property]) {
            return this._config[property];
        } else {
            if (valueIfUndefined != undefined) {
                return valueIfUndefined;
            } else {
                return undefined;
            }
        }
    }
}

new ServerApp().start();
