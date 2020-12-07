const fs = require('fs')

var path = require('path');
var p = path.join(__dirname, 'js/app.js');
var p2 = path.join(__dirname, 'js/app2.js');
let content = "";
let lines;

const directoryPath = path.join(__dirname, 'js');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        console.log(file); 
    });
});

try {
    content = fs.readFileSync(p, 'utf8');
    lines = content.split("\r\n");
    content="";
    for(let i = 0; i < lines.length;i++){
        let line = lines[i];
        if(lines[i].indexOf("import") != -1){
            lines.splice(i, 1);
            i--;
            continue;
        }
        let start = line.indexOf("export ");
        if(start != -1){
            console.log(line);
            let preStr = line.substr(0,start);
            let postStr = line.substr(start+"export ".length, line.length);
            lines[i] = preStr + postStr;
        }
        
    }
    content = lines.join('\n');

} catch (content) {
  console.error(err)
}

try {
    const data = fs.writeFileSync(p2, content)
    //file written successfully
  } catch (err) {
    console.error(err)
  }