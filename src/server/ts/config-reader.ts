const fs = require("fs");
const jsonManager = require("jsonfile");

const configFilePath = "config.json";
const configExampleFilePath = "config.json";

export class ConfigReader {
    static instance: ConfigReader;
    private _config: any;
    constructor() {
        if (fs.existsSync(configFilePath)) {// Pokud existuje soubor s konfigurací, načte se
            this._config = jsonManager.readFileSync(configFilePath);
        } else { // V opačném případě se zjišťuje, zda existuje soubor s příkladem konfigurace.
            if (fs.existsSync(configExampleFilePath)) {// Pokud soubor s příkladem konfigurace existuje, vytvoří na jeho základě konfigurační soubor
                this._config = jsonManager.readFileSync(configExampleFilePath);
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            } else {// Pokud ani soubor s příkladem konfigurace neexistuje, vytvoří se programově oba soubory
                this._config = {
                    "webAppPort": 80, // Port, na kterém webový server funguje
                    "NEW_MODULE_FIND_TIMEOUT": 10000,
                    "username": "", // Přihlašovací jméno k Firebase účtu
                    "password": "", // heslo k Firebase účtu
                    "saveUserCredentialsOnLogin": true, // Rozhoduje, zda ukládat přihlašovací údaje uživatele do Firebase při každém případném přihlášení ve webovém klientovi (pokud k němu uživatel přistupuje lokálně)
                    "openBrowserToRegister": true, // Rozhoduje, zda při startu serveru otevřít (na zařízení kde běží server) internetový prohlížeč s registrační stránkou, pokud uživatel nemá spárovaný lokální účet s Firebase účtem (tedy pokud nemá v configu nastavené klíče username a password)
                    "openBrowserOnStart": true, // Rozhoduje, zda se má automaticky (na zařízení kde běží server) otevřít internetový prohlížeč  s přihlašovací stránkou. Pokud má zařízení deplej a je určeno k tomu aby sloužilo jako prvek v domácnosti "na zdi", který bude zobrazovat snímače a zařízení v místnosti, je vhodné nastavit jej na hodnotu true
                    "clearLogFilesOnStart": true, // Rozhoduje, zda se mají při startu serveru smazat soubory, logující chyby (log.txt a log.html). Pokud je false, tak v souboru zůstávají staré logy (ale až po těch nových)
                    "showLogFilesOnError": true, // Rozhoduje, zda se má v prohlížeči otevřít log s chybami v případě pádu aplikace.
                    "firebase": { // Konfigurace Firebase aplikace, je nutné získat z Firebase účtu...
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
                }
                jsonManager.writeFileSync(configExampleFilePath, this._config, { spaces: 2 });
                jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
            }
        }


    }

    /**
     * ConfigReader používá vzoru Singleton. Tato funkce vrátí instanci třídy, neexistuje-li, tak ji nejprve vytvoří.
     * @returns Instanci třídy ConfigReader
     */
    public static getInstance(): ConfigReader{
    	if(this.instance == undefined){
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
     private _getValue(property: string, valueIfUndefined?: any) {
        if (this._config && (this._config[property] != undefined)) {
            return this._config[property];
        } else {
            if (valueIfUndefined != undefined) {
                return valueIfUndefined;
            } else {
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
    public static getValue(property: string, valueIfUndefined?: any){
        let reader = ConfigReader.getInstance();
        return reader._getValue(property, valueIfUndefined);
    }
    /**
     * Funkce vrátí hodnotu požadovaného klíče z configu
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    private _setValue(property: string, value?: any) {
        this._config[property] = value;
        jsonManager.writeFileSync(configFilePath, this._config, { spaces: 2 });
    }

    /**
     * Statická verze funkce getValue()
     * @param property Vlastnost z configu, kterou chceme získat
     * @param valueIfUndefined Hodnota, která se vrací, pokud daná vlastnost v configu není nastavená.
     * @returns Hodnotu vlastnosti z configu, pokud existuje, jinak hodnotu valueIfUndefined, pokud je nastavená, jinak undefined
     */
    public static setValue(property: string, value: any): void{
        let reader = ConfigReader.getInstance();
        reader._setValue(property, value);        
    }
}