
var express = require('express');
var path = require('path');

module.exports = class ServerApp{
    private app: any = express();
    constructor(){     

        var p = path.join(__dirname, '../../web/public');
        console.log(' p: ',  p);
        this.app.use("/files", function (req, res) {
            return res.send("I will be served instead of a files directory");
        });
        this.app.use(express.static(p));
        this.app.use('/*',express.static(p));
        this.app.post('/domu', function (req,res){
            console.log("qqqqq",req.url);
            res.redirect(req.url);
        })
        /*this.app.use('/*',express.static(p));
        this.app.use("/", function (req, res) {
            console.log("ADFG",req.url);
            res.redirect(req.url);
        });*/
    }

    start(port: number = 8084){
        var server = this.app.listen(port);
    }
}