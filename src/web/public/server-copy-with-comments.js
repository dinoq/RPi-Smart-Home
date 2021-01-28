
/*var fs = require('fs'),
    http = require('http');

http.createServer(function (req, res) {
  fs.readFile(__dirname + '/index.html', function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.end(data);
  });
}).listen(8080);*/
/*
var static = require('node-static');
var http = require('http');

var file = new(static.Server)(__dirname);

http.createServer(function (req, res) {
  file.serve('/index.html', res);
}).listen(8080);*/
/*
var express = require('express');
var app = express();
var ip = require("ip");
console.dir( ip.address() );
//setting middleware
//app.use(express.static(__dirname)); //Serves resources from public folder

//app.use(express.static(__dirname)); 
/*
app.get('/', function (req, res) {
    //res.send('hello world')
  })
  app.get('/f/*', function (req, res) {
    //res.send(req.baseUrl);
    res.send("req.baseUrl:"+req.url);
    console.log(req.url);
  })*/
/*
app.use(redirectUnmatched); 
function redirectUnmatched(req, res) {
    //res.redirect("/");
    //express.static(__dirname)
    console.log(req.url);
    express.static(__dirname);
    next();
  }
let port = 80;
var server = app.listen(port);

*/




/*var fs = require('fs'),
    http = require('http');

http.createServer(function (req, res) {
  fs.readFile(__dirname + '/index.html', function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.end(data);
  });
}).listen(8080);*/
/*
var static = require('node-static');
var http = require('http');

var file = new(static.Server)(__dirname);

http.createServer(function (req, res) {
  file.serve('/index.html', res);
}).listen(8080);*/

var express = require('express');
var app = express();
var path = require('path');
var p = path.join(__dirname/*, '../web/public'*/);
console.log(' p: ',  p);
app.use("/files", function (req, res) {
    return res.send("I will be served instead of a files directory");
});
app.use(express.static(p));
//app.use(/\/.*\/?/gi, express.static(p));
/*
app.use(redirectUnmatched); 
function redirectUnmatched(req, res, next) {
    //Do something on server
    if(false){
        return res.send("something<br>"+req.url+"<br>"+req.path);
    }else{
        next();
    }
}*/
app.use('/*',express.static(p));
/*
app.post(express.static(p));
app.post('/*', express.static(p));*/
/*app.post("/dashboard", function (req, res) {
    return res.send("I will do something with this post");
  });*/
  app.use("/", function (req, res) {
    return res.redirect(req.url);
  });
let port = 80;
var server = app.listen(port);


//^(?!\/qwe$)\/.*$