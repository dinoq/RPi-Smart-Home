var express = require('express');
var app = express();
var path = require('path');
/*var ip = require("ip");
console.log("http://"+ip.address() );*/

var p = path.join(__dirname, '/public');
console.log(' p: ',  p);
app.use("/files", function (req, res) {
    return res.send("I will be served instead of a files directory");
});
app.use(express.static(p));
app.use('/*',express.static(p));
  app.use("/", function (req, res) {
    return res.redirect(req.url);
  });
let port = 80;
var server = app.listen(port);