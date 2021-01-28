import { Singleton } from "./singleton.js";

export class EventManager extends Singleton{

    private _blockedByUnsavedChanges = false;
    
    public static set blockedByUnsavedChanges(val : boolean) {
        let eManager = EventManager.getInstance();
        eManager._blockedByUnsavedChanges = val;
    }
    public static get blockedByUnsavedChanges() {
        let eManager = EventManager.getInstance();
        return eManager._blockedByUnsavedChanges;
    }
    
    private callbacks: any = {};
    constructor(){
        super();        
    }
    public static getInstance() {
        return <EventManager>super.getInstance();
    }

    public static async waitIfUnsavedChanges(){
        let eManager = EventManager.getInstance();
        return new Promise((resolve, reject)=>{
            if(EventManager.blockedByUnsavedChanges){
                eManager.addListener("changesSaved", ()=>{
                    resolve(null);
                });
                eManager.addListener("changesCanceled", ()=>{
                    reject("Action Canceled");
                });
            }else{
                resolve(null);
            }
        })
    }

    public addListener(event: string, callback) {
        if(!this.callbacks[event]){
            this.callbacks[event] = new Array();
        }
        this.callbacks[event].push(callback);
    }

    public static dispatchEvent(eventName: string){
        let eManager = EventManager.getInstance();
        if(!eManager.callbacks[eventName])
            return;
        eManager.callbacks[eventName].forEach(callback => {
            callback();
        });
        eManager.callbacks[eventName] = undefined;
    }
}