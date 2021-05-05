"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigReader = void 0;
const fs = require("fs");
const path = require('path');
const jsonManager = require("jsonfile");
const configFilePath = "config.json";
const error_logger_1 = require("./error-logger");
class ConfigReader {
    constructor() {
        if (fs.existsSync(configFilePath)) { // Pokud existuje soubor s konfigurací, načte se            
            try {
                this._config = jsonManager.readFileSync(configFilePath);
            }
            catch (error) {
                this._config = ConfigReader.CONFIG_EXAMPLE;
                let fullPath = path.join(__dirname, '../' + configFilePath);
                error_logger_1.ErrorLogger.log(error, {
                    errorDescription: `Došlo k chybě při pokusu o načtení konfiguračního souboru (souboru ${fullPath})!`,
                    placeID: 29,
                });
            }
        }
        else {
            let fullPath = path.join(__dirname, '../' + configFilePath);
            error_logger_1.ErrorLogger.log(null, {
                errorDescription: `Konfigurační soubor nenalezen (soubor ${fullPath})! Soubor bude vytvořen...`,
                placeID: 31,
            });
            this._config = ConfigReader.CONFIG_EXAMPLE;
            jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
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
ConfigReader.CONFIG_EXAMPLE = {
    "webAppPort": 80,
    "username": "",
    "password": "",
    "saveUserCredentialsOnLogin": true,
    "openBrowserToRegister": false,
    "openBrowserOnStart": true,
    "clearLogFilesOnStart": false,
    "showLogFilesOnError": true,
    "firebase": {
        "apiKey": "AIzaSyAMNdGufrEtSQzUw09i0KxiQG9NjP0hjR4",
        "authDomain": "homeautomation-55256.firebaseapp.com",
        "databaseURL": "https://homeautomation-55256-default-rtdb.firebaseio.com",
        "projectId": "homeautomation-55256",
        "storageBucket": "homeautomation-55256.appspot.com",
        "messagingSenderId": "98237875458",
        "appId": "1:98237875458:web:7508e37bd1ebf7e3552e1b",
        "measurementId": "G-KVWKXNKSRF"
    },
    "debugLevel": 1 // Rozhoduje o množství informací, které server vypisuje do konzole. Číslo 0 - 2.
};
