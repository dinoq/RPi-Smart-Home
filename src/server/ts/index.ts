const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const open = require('open');
const jsonManager = require("jsonfile");
const fs = require("fs");

import { CommunicationManager } from "./communication-manager.js";
import { ConfigReader } from "./config-reader.js";
import { ErrorLogger } from "./error-logger.js";
import { Firebase } from "./firebase.js";


class ServerApp {
    private _app: any = express();
    private _firebase: Firebase;
    private _port: any;

    private _serverStartedPromiseResolver;
    private _serverStartedPromise = new Promise((resolve, reject) => { this._serverStartedPromiseResolver = resolve; }) // Slouží pro čekání na spuštění serveru (např některé informace je potřeba vypsat až po úspěšném spuštění serveru...)
    devicePairedWithAccount: boolean = false;

    constructor() {
        this._clearLogFiles();
        if (CommunicationManager.getAddressInfos().length == 0) {
            ErrorLogger.log(null, {
                errorDescription:"Došlo k neznámé chybě při startu aplikace! Server pravděpodobně není připojený k žádnému AP! \nPro funkci systému není nutné mít připojení k internetu, ale je nezbytné, aby bylo zařízení, na kterém poběží server připojeno do lokální sítě (k AP)!", 
                placeID: 6
            }, null, 5);
        }


        this._port = ConfigReader.getValue("webAppPort", 80);


        this._firebase = new Firebase();

        /*this._app.use("/updates", (req, res) => {
        });*/

        this._app.use(bodyParser.json())
        this._app.use(bodyParser.urlencoded({
            extended: true
        }));

        this._app.use((req, res, next) => {
            if (req.url.includes("addDBListener")) {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                })
                res.write('\n\n');
                let path = (req.query && req.query.path) ? req.query.path : "";
                this._firebase.addClientDBListener(path, res);
            } else {
                next();
            }
        });

        this.devicePairedWithAccount = ConfigReader.getValue("username", "").length>0 && ConfigReader.getValue("username", "").length>0;
        
        // Zpracování všechPOST požadavků od klientů
        this._app.post('/*', (req, res) => {
            if (ConfigReader.getValue("debugLevel", 0) > 0) {
                console.log("Požadavek od klienta na: " + req.url);
            }
            
            if (req.url.includes("/alive")) {// Dotaz, na server pro ověření, že funguje spojení mezi (webovým) klientem a serverem
                res.sendStatus(200);
            } else if (req.url.includes("/updateData")) {// Požadavek na aktualizaci dat v databázi
                this._firebase.clientUpdateInDB(req.body).then((value) => {
                    res.sendStatus(200);
                })
            } else if (req.url.includes("/pushData")) { // Požadavek na vložení nových dat do databáze
                this._firebase.clientPushToDB(req.body).then((key) => {
                    res.send(key);
                })
            } else if (req.url.includes("/getData")) { // Požadavek na získání dat z databáze
                this._firebase.clientGetFromDB(req.body).then((data) => {
                    res.send(data);
                })
            } else if (req.url.includes("/deleteData")) { // Požadavek na smazání dat v databázi
                this._firebase.clientRemoveFromDB(req.body).then((data) => {
                    res.sendStatus(200);
                })
            } else if (req.url.includes("CopyDatabase")) { // Požadavek na nahrazení jedné z databází (lokální/Firebase) tou druhou. Volá se po prvotním spárování s uživatelským účem, kde si uživatel vybírá, kteoru z databází zachovat (pro případy konfliktu)
                //CopyDatabaseFromFirebase or CopyDatabaseToFirebase
                console.log("REQ for copying db: " + req.url);
                let fromFirebase = (req.url.includes("CopyDatabaseFromFirebase"));
                this._firebase.copyDatabase(fromFirebase).then((value) => {
                    res.sendStatus(200);
                }).catch((value) => {
                    res.sendStatus(423);
                })
            } else { // Jinak je POST požadavek na po úspěšném přihlášení (resp. spárování s účtem Firebase) či registraci (Firebase)
                let uName;
                let pwd;
                if (req.header('Referer').includes("login") || req.header('Referer').includes("sparovat_ucet")) { // Přihlášení (resp. spárování s účtem Firebase)
                    let saveUserCredentialsOnLogin = ConfigReader.getValue("saveUserCredentialsOnLogin", true);
                    saveUserCredentialsOnLogin = saveUserCredentialsOnLogin == true || saveUserCredentialsOnLogin == "true";
                    if (saveUserCredentialsOnLogin) {
                        uName = (req && req.body) ? req.body["username"] : undefined;
                        pwd = (req && req.body) ? req.body["password"] : undefined;
                    }
                } else if (req.header('Referer').includes("registrace")) { // Registrace (Firebase)
                    uName = (req && req.body) ? req.body["registration-username"] : undefined;
                    pwd = (req && req.body) ? req.body["registration-pwd"] : undefined;
                }
                
                if (uName != undefined && pwd != undefined) {
                    ConfigReader.setValue("username", uName);
                    ConfigReader.setValue("password", pwd);
                    this.devicePairedWithAccount = true;
                    console.log("Přihlašovací údaje uloženy do konfiguračního souboru.");
                    this._firebase.login(uName, pwd);
                }
                res.redirect("http://" + req.hostname + "/domu"); // Po přihlášení a případném uložení přihl. údajů do configu dojde k přesměrování klienta na domovskou stránku.
            }
        });

        
        this._app.get('/*', (req, res, next) => {
            if (req.url.includes("paired")) { // Požadavek od klienta na získání informace, zda je zařízení spárováno s uživ. účtem Firebase (jinými slovy, zda má v configu přihl. údaje)
                res.send({ paired: this.devicePairedWithAccount });
            } else {
                next();
            }
        });
        let portStr = (this._port == 80) ? "" : ":" + this._port;
        if (this.devicePairedWithAccount) {
            this._firebase.login(ConfigReader.getValue("username"), ConfigReader.getValue("password")).then((value) => {
                if (ConfigReader.getValue("openBrowserOnStart", true)) {// Po startu serveru
                    this._serverStartedPromise.then((value) => { // Pokud je v to v configu nastavené (vlastností openBrowserOnStart), otevře se automaticky domovská stránka webové aplikace v internetovém prohlížeči.
                        open('http://localhost' + portStr + '/domu');
                    })
                }
            })
        } else {
            this._serverStartedPromise.then((value) => { // Po startu serveru
                console.log("Vypadá to, že server není spárován s žádným uživatelským účtem. Pro spárování je nutné se ze zařízení, na kterém server běží zaregistovat (na http://localhost" + portStr + "/registrace/) či přihlásit (http://localhost" + portStr + "/login/), dříve nebude možné systém ovládat přes internet (mimo lokální síť). K registraci je vyžadováno internetové připojení.");
                console.log("Spárování pomocí přihlášení/registrace je také možné provést z jiného zařízení v lokální síti na adrese: http://" + CommunicationManager.getServerIP() + portStr + "/login/, resp.: http://" + CommunicationManager.getServerIP() + portStr + "/registrace/");

                if (ConfigReader.getValue("openBrowserToRegister", true)) {// Pokud uživatel nemá spárovaný účet, tak po startu serveru otevřít internetový prohlížeš s otevřenou registrací (pokud je toto chování nastavené v configu vlastností openBrowserToRegister)
                    open('http://localhost' + portStr + '/registrace?forceLogout=true');

                }
            })
        }

        let webClientFilesPath = path.join(__dirname, '../../web/public');
        // Server bude klientů poskytovat statický obsah z adresáře webClientFilesPath
        this._app.use(express.static(webClientFilesPath), (req, res, next) => {
            next();
        });
        this._app.use('/*', express.static(webClientFilesPath), (req, res, next) => {
            next();
        });
        this._app.use((req, res, next) => {
            next();
        });
        this._app.use((req, res, next) => {
            next();
        });

    }

    /**
     * Funkce spustí webový server, který v případě úspěšného spuštění naslouchá na portu specifikovaném configem, resp. na portu 80, pokud není specifikován. 
     * Funkce ošetřuje chyby a pokud nějaká nastane během spouštění webového serveru, tak vypíše chybovou hlášku a ukončí aplikaci.
     */
    public start() {

        try {
            let server = this._app.listen(this._port, (err) => {
                // Obsluha chyb
                if (err) {
                    if (err.code == "EADDRINUSE") {
                        ErrorLogger.log(err, {
                            errorDescription:"Zvolený port (" + this._port + ") již využívá jiná aplikace. Zvolte jiný port v souboru server/config.json!", 
                            placeID: 17
                        }, null, 5);
                    } else if (err.code == "EACCES") {
                        ErrorLogger.log(err, {
                            errorDescription:"Nemáte přístup ke zvolenému portu (" + this._port + "). Zvolte jiný port (s hodnotou > 1023) v souboru server/config.json, nebo spusťe server jako admin (sudo npm start)!", 
                            placeID: 16
                        }, null, 5);
                    } else if (err && err.code == "ERR_SOCKET_BAD_PORT") {
                        let tooHighPortNumberMsg = (this._port > 65535) ? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                        ErrorLogger.log(err, {
                            errorDescription:"Špatně zvolený port (" + this._port + ")! " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!", 
                            placeID: 15
                        }, null, 5);
                    } else {
                        ErrorLogger.log(err, {
                            errorDescription:"Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!", 
                            placeID: 3
                        }, null, 5);
                    }
                } else {
                    // Server byl úspěšně spuštěn
                    if (ConfigReader.getValue("debugLevel", 0) > 1) {
                        let portStr = (this._port == 80) ? "" : ":" + this._port;
                        console.log("Pro přístup k webové aplikaci ze zařízení, na kterém běží server přejděte v internetovém prohlížeči na adresu http://localhost" + portStr);
                        console.log("Pro přístup k webové aplikaci ze jiného zařízení v lokální síti přejděte v internetovém prohlížeči na adresu http://" + CommunicationManager.getServerIP() + portStr);
                        console.log("Pro přístup k webové aplikaci ze jiného zařízení globálně (přes internet) přejděte v internetovém prohlížeči na adresu https://auto-home.web.app/");
                    } else if (ConfigReader.getValue("debugLevel", 0) > 0) {
                        console.log("Server naslouchá na portu: " + this._port);
                        console.log("IP adresa serveru: " + CommunicationManager.getServerIP());
                    }
                    this._serverStartedPromiseResolver(); // Resolvne Promise, na kterou se v kódu čeká tam, kde je potřeba aby server už běžel...
                }
            });
            server.on("error", (err) => {
                // Obsluha chyb
                if (err && err.code == "EADDRINUSE") {
                    ErrorLogger.log(err, {
                        errorDescription:"Zvolený port (" + this._port + ") již využívá jiná aplikace. Zvolte jiný port v souboru server/config.json!", 
                        placeID: 22
                    }, null, 5);
                } else if (err && err.code == "EACCES") {
                    ErrorLogger.log(err, {
                        errorDescription:"Nemáte přístup ke zvolenému portu (" + this._port + "). Zvolte jiný port (s hodnotou > 1023) v souboru server/config.json, nebo spusťe server jako admin (sudo npm start)!", 
                        placeID: 21
                    }, null, 5);
                } else if (err && err.code == "ERR_SOCKET_BAD_PORT") {
                    let tooHighPortNumberMsg = (this._port > 65535) ? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                    ErrorLogger.log(err, {
                        errorDescription: "Špatně zvolený port (" + this._port + ")! " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!",
                        placeID: 20
                    }, null, 5);
                } else {
                    ErrorLogger.log(err, {
                        errorDescription:"Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!", 
                        placeID: 4
                    }, null, 5);
                }
            })
        } catch (err) {
            // Obsluha chyb
            if (err && err.code == "ERR_SOCKET_BAD_PORT") {
                let tooHighPortNumberMsg = (this._port > 65535) ? "Číslo portu musí být v rozmezí 0 až 65535." : "";
                ErrorLogger.log(err, {
                    errorDescription: "Špatně zvolený port (" + this._port + ")! " + tooHighPortNumberMsg + " Zvolte jiný port v souboru server/config.json!",
                    placeID: 18
                });
                process.exit(5);
            } else {
                ErrorLogger.log(err, {
                    errorDescription: "Došlo k neznámé chybě při pokusu o vytvoření serveru na portu " + this._port + "!", 
                    placeID: 5
                });
                process.exit(5);
            }
        }
    }

    private _clearLogFiles(){        
        if (ConfigReader.getValue("clearLogFilesOnStart", false)) {
            try {
                if (fs.existsSync(ErrorLogger.ERROR_LOG_FILE_PATH)) {
                    fs.unlinkSync(ErrorLogger.ERROR_LOG_FILE_PATH);
                    /*try{
                        fs.writeFileSync(ErrorLogger.ERROR_LOG_FILE_PATH, "");
                    }catch (err){
                        ErrorLogger.log(err, {
                            errorDescription: `Neznámá chyba při pokusu o vytvoření souboru pro logování chyb (${ErrorLogger.ERROR_LOG_FILE_PATH})!`, 
                            placeID: 24
                        })
                    }*/
                }
                if (fs.existsSync(ErrorLogger.ERROR_HTML_LOG_FILE_PATH)) {
                    fs.unlinkSync(ErrorLogger.ERROR_HTML_LOG_FILE_PATH);
                    /*try{
                        fs.writeFileSync(ErrorLogger.ERROR_HTML_LOG_FILE_PATH, "");
                    }catch (err){
                        ErrorLogger.log(err, {
                            errorDescription: `Neznámá chyba při pokusu o vytvoření souboru pro logování chyb (${ErrorLogger.ERROR_HTML_LOG_FILE_PATH})!`, 
                            placeID: 25
                        })
                    }*/
                }
            } catch (err) {
                ErrorLogger.log(err, {
                    errorDescription:"Neznámá chyba při pokusu o smazání souborů pro logování chyb!", 
                    placeID: 13
                })
            }
        }
    }
}

//Nainicalizuje a pustí aplikaci serveru
new ServerApp().start();
