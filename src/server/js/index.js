"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const open = require('open');
const editJsonFile = require("edit-json-file");
const firebase_js_1 = require("./firebase.js");
class ServerApp {
    constructor() {
        this._app = express();
        this.config = editJsonFile("config.json", {
            autosave: true
        });
        this._firebase = new firebase_js_1.Firebase();
        var p = path.join(__dirname, '../../web/public');
        /*this._app.use("/updates", (req, res) => {
            console.log('update...');

            if (this._firebase.loggedIn)
                res.send("I will be served instead of a files directory");
            else
                res.send("Musíte se přihlásit!!!");
        });*/
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({
            extended: true
        }));
        this._app.post('/*', (req, res) => {
            /*if(req.get('Referer').includes("uzivatel/login")){ // Logged in
                let username = req.body.login;
                let pwd = req.body.password;
                if(username && pwd)
                    this._firebase.login(username, pwd);
            }
            console.log(req.body)
            console.log("qqqqq",req.url);*/
            if (req.url.includes("/update")) {
                this._firebase.offlineUpdate(req.body);
            }
            else {
                let uName;
                let pwd;
                if (req.header('Referer').includes("login")) {
                    let saveUserCredentialsOnLogin = this.config.get("saveUserCredentialsOnLogin");
                    saveUserCredentialsOnLogin = saveUserCredentialsOnLogin == true || saveUserCredentialsOnLogin == "true";
                    if (saveUserCredentialsOnLogin) {
                        uName = (req && req.body) ? req.body["username"] : undefined;
                        pwd = (req && req.body) ? req.body["password"] : undefined;
                    }
                }
                else if (req.header('Referer').includes("registrace")) {
                    uName = (req && req.body) ? req.body["registration-username"] : undefined;
                    pwd = (req && req.body) ? req.body["registration-pwd"] : undefined;
                }
                if (uName != undefined && pwd != undefined) {
                    this.config.set("username", uName);
                    this.config.set("password", pwd);
                    console.log("Přihlašovací údaje uloženy do konfiguračního souboru.");
                    this._firebase.login(uName, pwd);
                }
                res.redirect("http://" + req.hostname + "/domu");
                //res.redirect(req.url);
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
        if (this.config.get("username") != undefined && this.config.get("password") != undefined) {
            this._firebase.login(this.config.get("username"), this.config.get("password"));
        }
        else {
            console.log("Vypadá to, že server není spárován s žádným uživatelským účtem. Pro spárování je nutné se ze zařízení, na kterém server běží zaregistovat (na http://localhost/domu/) či přihlásit, dříve server nebude pracovat. K registraci je vyžadováno internetové připojení.");
            open('http://localhost/registrace?forceLogout=true');
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
    start(port) {
        var server = this._app.listen(port || this.config.get("port") || 60000);
        console.log("Server běží na portu: " + (port || this.config.get("port") || 60000) + ".");
    }
}
new ServerApp().start();
