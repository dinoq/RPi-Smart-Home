const fs = require('fs')

var path = require('path');
var p = path.join(__dirname, 'js/app.js');
var buildPath = path.join(__dirname, 'js/build.js');
let content = "";
let lines;

const directoryPath = path.join(__dirname, 'js');

let files  = [];

getFileNames(directoryPath);
console.log(files);


let concatenatedContent = "";
for(let i = 0; i < files.length; i++){
    if(files[i].indexOf("build.js") == -1){
        concatenatedContent += appendCode(files[i]);
    }
}
build(buildPath, concatenatedContent);


function getFileNames(Directory) {
    fs.readdirSync(Directory).forEach(File => {
        const Absolute = path.join(Directory, File);
        if (fs.statSync(Absolute).isDirectory()) return getFileNames(Absolute);
        else return files.push(Absolute);
    });
}


function appendCode(url){
    let content = fs.readFileSync(url, 'utf8');
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
    return content;
}
function build(path, content){
    const data = fs.writeFileSync(path, content);
}