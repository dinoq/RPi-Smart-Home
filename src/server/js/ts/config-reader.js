"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigReader = void 0;
const fs = require("fs");
const jsonManager = require("jsonfile");
const configFilePath = "config.json";
const configExampleFilePath = "config.json";
class ConfigReader {
    constructor() {
        if (fs.existsSync(configFilePath)) { // Pokud existuje soubor s konfigurací, načte se
            this._config = jsonManager.readFileSync(configFilePath);
        }
        else { // V opačném případě se zjišťuje, zda existuje soubor s příkladem konfigurace.
            if (fs.existsSync(configExampleFilePath)) { // Pokud soubor s příkladem konfigurace existuje, vytvoří na jeho základě konfigurační soubor
                this._config = jsonManager.readFileSync(configExampleFilePath);
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            }
            else { // Pokud ani soubor s příkladem konfigurace neexistuje, vytvoří se programově oba soubory
                this._config = {
                    "webAppPort": 80,
                    "NEW_MODULE_FIND_TIMEOUT": 10000,
                    "username": "",
                    "password": "",
                    "saveUserCredentialsOnLogin": true,
                    "openBrowserToRegister": true,
                    "openBrowserOnStart": true,
                    "clearLogFilesOnStart": true,
                    "showLogFilesOnError": true,
                    "firebase": {
                        "apiKey": "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
                        "authDomain": "home-automation-80eec.firebaseapp.com",
                        "databaseURL": "https://home-automation-80eec.firebaseio.com",
                        "projectId": "home-automation-80eec",
                        "storageBucket": "home-automation-80eec.appspot.com",
                        "messagingSenderId": "970359498290",
                        "appId": "1:970359498290:web:a43e83568b9db8eb783e2b",
                        "measurementId": "G-YTRZ79TCJJ"
                    },
                    "debugLevel": 1 // Rozhoduje o množství informací, které server vypisuje do konzole. Číslo 0 - 2.
                };
                jsonManager.writeFileSync(configExampleFilePath, this._config, { spaces: 2 });
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            }
        }
    }
    /**
     * ConfigReader používá vzoru Singleton. Tato funkce vrátí instanci třídy, neexistuje-li, tak ji nejprve vytvoří.
     * @returns Instanci třídy ConfigReader
     */
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new this();
        }
        return this.instance;
    }
    /**
     * Funkce vrátí hodnotu požadovaného klíče z configu
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    _getValue(property, valueIfUndefined) {
        if (this._config && (this._config[property] != undefined)) {
            return this._config[property];
        }
        else {
            if (valueIfUndefined != undefined) {
                return valueIfUndefined;
            }
            else {
                return undefined;
            }
        }
    }
    /**
     * Statická verze funkce getValue()
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    static getValue(property, valueIfUndefined) {
        let reader = ConfigReader.getInstance();
        return reader._getValue(property, valueIfUndefined);
    }
    /**
     * Funkce vrátí hodnotu požadovaného klíče z configu
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    _setValue(property, value) {
        this._config[property] = value;
        jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
    }
    /**
     * Statická verze funkce getValue()
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    static setValue(property, value) {
        let reader = ConfigReader.getInstance();
        reader._setValue(property, value);
    }
}
exports.ConfigReader = ConfigReader;