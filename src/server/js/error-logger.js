"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLogger = void 0;
const fs = require('fs');
const prependFile = require('prepend-file');
const os = require('os');
const path = require('path');
const open = require('open');
const config_reader_1 = require("./config-reader");
const lineBreak = (os.platform() == "win32") ? "\r\n" : "\n";
const doubleLineBreak = lineBreak + lineBreak;
const line = "________________________________________________________________________" + lineBreak;
const lightLine = "------------------------------------------" + lineBreak;
class ErrorLogger {
    constructor() {
        this._writingToFilePromise = new Promise((resolve, reject) => { this.initialWritingToFilePromiseResolver = resolve; });
        this._logCount = 0;
    }
    /**
     * ErrorLogger používá vzoru Singleton. Tato funkce vrátí instanci třídy, neexistuje-li, tak ji nejprve vytvoří.
     * @returns Instanci třídy ErrorLogger
     */
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new this();
        }
        return this.instance;
    }
    _colorize(str, color) {
        return `<span style="color: ${color}">${str}</span>`;
    }
    async logToFile(nativeError, errorInfo, state, exitCode = -1) {
        let logCount = this._logCount;
        let logID = ""; // Náhodné 30ti místné ID chyby pro identifikaci
        let charArr = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i < 30; i++) {
            let newChar = charArr[Math.floor(Math.random() * charArr.length)];
            logID += newChar;
        }
        let exitCodeStr = (exitCode > -1) ? `Chyba byla fatální, exit code aplikace:  ${exitCode}` : `Chyba nebyla fatální (nezpůsobila pád aplikace).`;
        let exitCodeStrHTML = (exitCode > -1) ? this._colorize(`Chyba byla fatální, exit code aplikace:  ${exitCode}`, "red") : this._colorize(`Chyba nebyla fatální (nezpůsobila pád aplikace).`, "#5fbc00");
        let trackedObjects = "";
        let trackedObjectsHTML = "";
        if (state && Object.keys(state).length) {
            trackedObjects += `${lineBreak}Stav sledovaných objektů v době vzniku chyby: ${lineBreak}`;
            trackedObjectsHTML += this._colorize(`${lineBreak}Stav sledovaných objektů v době vzniku chyby: ${lineBreak}`, "blue");
            for (const property of Object.keys(state)) {
                if (Object.keys(state).indexOf(property) != 0) { // První řádek vynecháváme...
                    trackedObjects += "\t" + lightLine;
                    trackedObjectsHTML += "\t" + lightLine;
                }
                let json;
                try {
                    json = JSON.stringify(state[property], null, 2);
                    if (json) {
                        json = "\t\t" + json.split("\n").join(lineBreak + "\t\t");
                    }
                    else {
                        json = "\t\tObjekt není validním JSON objektem!";
                    }
                }
                catch (error) {
                    ErrorLogger.log(error, {
                        errorDescription: `Došlo k chybě při vytváření logu s id ${logID} do logovacího souboru (zřejmě některý ze sledovaných objektů obsahuje cyklické odkazy)!`,
                        placeID: 23
                    });
                    json = "\t\tObjekt není validním JSON objektem (zřejmě obsahuje cyklické odkazy)!";
                }
                trackedObjects +=
                    `\t${property}:${lineBreak}` +
                        `${json}${lineBreak}`;
                let maxColorVal = 170;
                let getRandColor = () => Math.floor(Math.random() * maxColorVal);
                trackedObjectsHTML +=
                    `\t${property}:${lineBreak}` +
                        `${json}${lineBreak}`;
                trackedObjectsHTML = this._colorize(trackedObjectsHTML, `rgb(${getRandColor()}, ${getRandColor()}, ${getRandColor()})`);
            }
        }
        else {
            trackedObjects = `Error logger nesleduje k dané chybě stav žádného objektu.`;
            trackedObjectsHTML = this._colorize(`Error logger nesleduje k dané chybě stav žádného objektu.`, "grey");
        }
        let reaction = "";
        let reactionHTML = "";
        if (errorInfo.reaction && errorInfo.reaction.length) {
            reaction +=
                `Reakce serveru na chybu:${lineBreak}` +
                    `${errorInfo.reaction}${doubleLineBreak}`;
            reactionHTML +=
                `Reakce serveru na chybu:${lineBreak}` +
                    `${this._colorize(errorInfo.reaction, "purple")}${doubleLineBreak}`;
        }
        let nativeErrorMsg = `Kompletní výpis původní chyby:${lineBreak}`;
        let nativeErrorMsgHTML = nativeErrorMsg;
        if (nativeError) {
            let stack = "";
            let stackHTML = "";
            if (nativeError.stack) {
                stack += "\t\t" + (nativeError.stack).split("\n").join(lineBreak + "\t\t");
            }
            else {
                stack += "Informace o zásobníku chybí";
            }
            stackHTML = stack;
            nativeErrorMsg +=
                `\tTyp chyby: ${nativeError.name + lineBreak}` +
                    `\tZpráva: ${nativeError.message + lineBreak}` +
                    `\tZásobník: ${lineBreak}${stackHTML}`;
            nativeErrorMsgHTML +=
                `\tTyp chyby: ${this._colorize(nativeError.name + lineBreak, "red")}` +
                    `\tZpráva: ${this._colorize(nativeError.message + lineBreak, "red")}` +
                    `\tZásobník: ${lineBreak}${this._colorize(stackHTML, "red")}`;
        }
        else {
            let stack = new Error().stack;
            let stackHTML = "";
            if (stack) {
                stack = "\t\t" + (stack).split("\n").join(lineBreak + "\t\t");
            }
            else {
                stack = "Informace o zásobníku chybí";
            }
            stackHTML = stack;
            nativeErrorMsg +=
                `\tTyp chyby: ${"Typ chyby chybí" + lineBreak}` +
                    `\tZpráva: ${"Zpráva o chybě chybí" + lineBreak}` +
                    `\tZásobník: ${lineBreak}${stack}`;
            nativeErrorMsgHTML +=
                `\tTyp chyby: ${this._colorize("Typ chyby chybí" + lineBreak, "red")}` +
                    `\tZpráva: ${this._colorize("Zpráva o chybě chybí" + lineBreak, "red")}` +
                    `\tZásobník: ${lineBreak}${this._colorize(stack, "red")}`;
        }
        nativeErrorMsgHTML = this._colorize(nativeErrorMsgHTML, "blue");
        let content = `Čas vzniku chyby: ${new Date().toLocaleString()}${lineBreak}` +
            `Číslo chyby od spuštění serveru: ${logCount.toString()}${lineBreak}` +
            `ID chyby: ${logID}${doubleLineBreak}` +
            `Chybová hláška:${lineBreak}${errorInfo.errorDescription}${doubleLineBreak}` +
            `${reaction}` +
            `Číslo chyby (placeID) pro lokaci v kódu: ${errorInfo.placeID}${doubleLineBreak}` +
            `${nativeErrorMsg}${doubleLineBreak}` +
            `${exitCodeStr}${doubleLineBreak}` +
            `${trackedObjects}${lineBreak}` +
            //`${lineBreak}`+
            `${line}`;
        let contentHTML = `<pre style="background-color: #ffd1d1;">` +
            `<code>` +
            `<hr>` +
            `<div style="padding: 10px 20px;">` +
            `Čas vzniku chyby: ${this._colorize(new Date().toLocaleString(), "blue")}${lineBreak}` +
            `Číslo chyby od spuštění serveru: ${this._colorize(logCount.toString(), "blue")}${lineBreak}` +
            `ID chyby: ${this._colorize(logID, "blue")}${doubleLineBreak}` +
            `Chybová hláška:${lineBreak}${this._colorize(errorInfo.errorDescription + lineBreak + lineBreak, "red")}` +
            `${reactionHTML}` +
            `Číslo chyby (placeID) pro lokaci v kódu: ${this._colorize(errorInfo.placeID + lineBreak + lineBreak, "red")}` +
            `${nativeErrorMsgHTML}${doubleLineBreak}` +
            `${exitCodeStrHTML}${doubleLineBreak}` +
            `${trackedObjectsHTML}${lineBreak}` +
            `</div>` +
            `<hr>` +
            `</code>` +
            `</pre>${lineBreak}`;
        if (this.initialWritingToFilePromiseResolver) {
            this.initialWritingToFilePromiseResolver();
            this.initialWritingToFilePromiseResolver = undefined;
        }
        this._writingToFilePromise = this._writingToFilePromise.then((value) => {
            return prependFile(ErrorLogger.ERROR_LOG_FILE_PATH, content);
        }).then((value) => {
            return prependFile(ErrorLogger.ERROR_HTML_LOG_FILE_PATH, contentHTML);
        });
        await this._writingToFilePromise;
        return { ID: logID, Count: logCount };
    }
    async _log(nativeError, errorInfo, state, exitCode = -1) {
        this._logCount++;
        let log = await this.logToFile(nativeError, errorInfo, state, exitCode);
        if (config_reader_1.ConfigReader.getValue("debugLevel", 0) > 0 || exitCode > -1) { // Pokud je debugLevel > 0, resp. chyba je fatální, zobrazit info o chybě
            let id = "";
            if (config_reader_1.ConfigReader.getValue("debugLevel", 0) > 1) {
                id = ` (č. ${log.Count}, id: ${log.ID})`;
            }
            console.log(`Došlo k chybě${id}, informace o všech chybách naleznete v souboru ${ErrorLogger.ERROR_HTML_LOG_FILE_PATH}, příp. ${ErrorLogger.ERROR_LOG_FILE_PATH}`);
        }
        if (exitCode > -1) {
            console.log(`Chyba je fatální, aplikace se ukončí s exit code: ${exitCode}`);
            let exitTimeout = 0;
            if (config_reader_1.ConfigReader.getValue("showLogFilesOnError", false)) {
                let fullPath = ErrorLogger.ERROR_HTML_LOG_FILE_PATH;
                try {
                    fullPath = path.join(__dirname, '../' + ErrorLogger.ERROR_HTML_LOG_FILE_PATH);
                    open(fullPath);
                    exitTimeout = 3000; // Pokud by se provedl process.exit() ihned, neprovede se open(viz řádek výše). 3 sekundy by měla být dostatečná doba...
                }
                catch (error) {
                    ErrorLogger.log(error, { errorDescription: `Došlo k neznámé chybě při pokusu otevřít webový prohlížeš s logovacím souborem (${fullPath})`, placeID: 14 });
                }
            }
            await this._writingToFilePromise; // Je potřeba počkat, až se chyby zapíší do logu
            await (new Promise(resolve => { setTimeout(resolve, exitTimeout); }));
            process.exit(exitCode);
        }
    }
    static async log(nativeError, errorInfo, state = {}, exitCode = -1) {
        let logger = ErrorLogger.getInstance();
        await logger._log(nativeError, errorInfo, state, exitCode);
    }
}
exports.ErrorLogger = ErrorLogger;
ErrorLogger.ERROR_LOG_FILE_PATH = "log.txt";
ErrorLogger.ERROR_HTML_LOG_FILE_PATH = "log.html";
