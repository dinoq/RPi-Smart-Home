import { Singleton } from "./singleton.js";

export class EventManager extends Singleton{

    private _blocked = false;
    
    public static set blocked(val : boolean) {
        let eManager = EventManager.getInstance();
        eManager._blocked = val;
    }
    public static get blocked() {
        let eManager = EventManager.getInstance();
        return eManager._blocked;
    }
    
    private callbacks: any = {};
    constructor(){
        super();        
    }
    public static getInstance() {
        return <EventManager>super.getInstance();
    }

    public static async waitIfBlocked(){
        let eManager = EventManager.getInstance();
        return new Promise((resolve, reject)=>{
            if(EventManager.blocked){
                eManager.addEventListener("unblocked", ()=>{
                    resolve(null);
                });
                eManager.addEventListener("cancelEvents", ()=>{
                    reject("Action Canceled");
                });
            }else{
                resolve(null);
            }
        })
    }

    public addEventListener(event: string, callback) {
        if(!this.callbacks[event]){
            this.callbacks[event] = new Array();
        }
        this.callbacks[event].push(callback);
    }

    public static dispatchEvent(event: string){
        let eManager = EventManager.getInstance();
        if(!eManager.callbacks[event])
            return;
        eManager.callbacks[event].forEach(callback => {
            callback();
        });
        eManager.callbacks[event] = undefined;
    }
}