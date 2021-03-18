var express = require('express');
var path = require('path');
const config = require("../config.json");
const bodyParser = require('body-parser');
const Firebase = require('./firebase.js');
const CommunicationMngr = require('./communication-manager.js');
module.exports = class ServerApp {
    constructor() {
        this._app = express();
        this._firebase = new Firebase();
        //console.log("Pro funkci systému nejprve přihlašte RPi server otevřením adresy http://" + CommunicationMngr.getServerIP() + " ve webovém prohlížeči.");
        var p = path.join(__dirname, '../../web/public');
        this._app.use("/files", (req, res) => {
            if (this._firebase.loggedIn)
                res.send("I will be served instead of a files directory");
            else
                res.send("Musíte se přihlásit!!!");
        });
        //this.app.use(bodyParser.json())
        this._app.use(bodyParser.urlencoded({
            extended: true
        }));
        this._app.post('/domu', (req, res) => {
            /*if(req.get('Referer').includes("uzivatel/login")){ // Logged in
                let username = req.body.login;
                let pwd = req.body.password;
                if(username && pwd)
                    this._firebase.login(username, pwd);
            }
            console.log(req.body)
            console.log("qqqqq",req.url);*/
            res.redirect(req.url);
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
        this._firebase.login(config.username, config.password);
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
        var server = this._app.listen(port || config.port);
    }
};
