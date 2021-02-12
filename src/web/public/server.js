var express = require('express');
var app = express();
var path = require('path');
/*var ip = require("ip");
console.log("http://"+ip.address() );*/


var firebase = require('firebase');
var app = firebase.initializeApp({ 
    apiKey: "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
    authDomain: "home-automation-80eec.firebaseapp.com",
    databaseURL: "https://home-automation-80eec.firebaseio.com",
    projectId: "home-automation-80eec",
    storageBucket: "home-automation-80eec.appspot.com",
    messagingSenderId: "970359498290",
    appId: "1:970359498290:web:a43e83568b9db8eb783e2b",
    measurementId: "G-YTRZ79TCJJ"
});
console.log("ASD0");
console.log("ASD",app);
console.log("ASD2",app.database());
console.log("ASD3",firebase.database());


var p = path.join(__dirname/*, '../web/public'*/);
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