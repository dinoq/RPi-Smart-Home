import { Singleton } from "./singleton.js";
export class EventManager extends Singleton {
    constructor() {
        super();
        this._blocked = false;
        this.callbacks = {};
    }
    static set blocked(val) {
        let eManager = EventManager.getInstance();
        eManager._blocked = val;
    }
    static get blocked() {
        let eManager = EventManager.getInstance();
        return eManager._blocked;
    }
    static getInstance() {
        return super.getInstance();
    }
    static async waitIfBlocked() {
        let eManager = EventManager.getInstance();
        return new Promise((resolve, reject) => {
            if (EventManager.blocked) {
                eManager.addEventListener("unblocked", () => {
                    resolve(null);
                });
                eManager.addEventListener("cancelEvents", () => {
                    reject("Action Canceled");
                });
            }
            else {
                resolve(null);
            }
        });
    }
    addEventListener(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = new Array();
        }
        this.callbacks[event].push(callback);
    }
    static dispatchEvent(event) {
        let eManager = EventManager.getInstance();
        if (!eManager.callbacks[event])
            return;
        eManager.callbacks[event].forEach(callback => {
            callback();
        });
        eManager.callbacks[event] = undefined;
    }
}
