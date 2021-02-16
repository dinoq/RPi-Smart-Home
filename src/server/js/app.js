var express = require('express');
var path = require('path');
const config = require("../config.json");
const bodyParser = require('body-parser');
module.exports = class ServerApp {
    constructor() {
        this.app = express();
        var p = path.join(__dirname, '../../web/public');
        console.log(' p: ', p);
        this.app.use("/files", function (req, res) {
            return res.send("I will be served instead of a files directory");
        });
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.post('/domu', function (req, res) {
            if (req.get('Referer').includes("uzivatel/login")) { // Logged in
                console.log(req.body);
            }
            console.log("qqqqq", req.url);
            res.redirect(req.url);
        });
        this.app.use(express.static(p), (req, res, next) => {
            console.log("ooo");
            next();
        });
        this.app.use('/*', express.static(p), (req, res, next) => {
            console.log("c");
            next();
        });
        this.app.use((req, res, next) => {
            console.log("XXX");
            next();
        });
        this.app.use((req, res, next) => {
            console.log("VVV");
            next();
        });
        /*this.app.use('/*',express.static(p));
        this.app.use("/", function (req, res) {
            console.log("ADFG",req.url);
            res.redirect(req.url);
        });*/
    }
    start(port) {
        var server = this.app.listen(port || config.port);
    }
};
