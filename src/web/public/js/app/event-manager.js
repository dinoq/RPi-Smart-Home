import { Singleton } from "./singleton.js";
export class EventManager extends Singleton {
    constructor() {
        super();
        this._blockedByUnsavedChanges = false;
        this.callbacks = {};
    }
    static set blockedByUnsavedChanges(val) {
        let eManager = EventManager.getInstance();
        eManager._blockedByUnsavedChanges = val;
    }
    static get blockedByUnsavedChanges() {
        let eManager = EventManager.getInstance();
        return eManager._blockedByUnsavedChanges;
    }
    static getInstance() {
        return super.getInstance();
    }
    static async waitIfUnsavedChanges() {
        let eManager = EventManager.getInstance();
        return new Promise((resolve, reject) => {
            if (EventManager.blockedByUnsavedChanges) {
                eManager.addListener("changesSaved", () => {
                    resolve(null);
                });
                eManager.addListener("changesCanceled", () => {
                    reject("Action Canceled");
                });
            }
            else {
                resolve(null);
            }
        });
    }
    addListener(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = new Array();
        }
        this.callbacks[event].push(callback);
    }
    static dispatchEvent(eventName) {
        let eManager = EventManager.getInstance();
        if (!eManager.callbacks[eventName])
            return;
        eManager.callbacks[eventName].forEach(callback => {
            callback();
        });
        eManager.callbacks[eventName] = undefined;
    }
}
