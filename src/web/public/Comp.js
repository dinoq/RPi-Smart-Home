const fs = require('fs')

var path = require('path');
var p = path.join(__dirname, 'js/app.js');
var p2 = path.join(__dirname, 'js/app2.js');
let content = "";
let lines;

const directoryPath = path.join(__dirname, 'js');

let Files  = [];

function ThroughDirectory(Directory) {
    fs.readdirSync(Directory).forEach(File => {
        const Absolute = Path.join(Directory, File);
        if (fs.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
        else return Files.push(Absolute);
    });
}

ThroughDirectory(__dirname);
console.log(Files);

try {
    content = fs.readFileSync(files[2], 'utf8');
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

} catch (err) {
  console.error(err)
}

try {
    const data = fs.writeFileSync(p2, content)
    //file written successfully
  } catch (err) {
    console.error(err)
  }