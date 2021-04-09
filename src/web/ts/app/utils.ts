import { Config } from "./config.js";

export class Utils {
    public static mergeObjects(obj1: Object, obj2: Object) {
        let result = {};
        for (const property in obj1) {
            result[property] = obj1[property];
        }
        for (const property in obj2) {
            result[property] = obj2[property];
        }
        return result;
    }

    public static pxToNumber(stringVal: string): number {
        let number = stringVal.substring(0, stringVal.length - 2);
        return Number.parseInt(number);
    }
    

    public static getWindowWidth(withPixelUnit: boolean = false): number | string {
        let width = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;

        if (withPixelUnit) {
            return (width + "px");
        } else {
            return width;
        }
    }

    public static getWindowHeight(withPixelUnit: boolean = false): number | string {
        let height = document.documentElement.scrollHeight
            || document.body.scrollHeight
            || window.innerHeight;

        if (withPixelUnit) {
            return (height + "px");
        } else {
            return height;
        }
    }
            
    public static itemIsAnyFromEnum(item: any, fromEnum: any, values: string[]):boolean{
        return values.some(value=>{
            return (fromEnum[item] == value)
        })
    }

    public static forEachLoop(arrayOrObject: Array<any> | Object, cycleBody: (item, index?, array?)=>void){
        if(!arrayOrObject)
            return;

        let i = 0;
        if(Array.isArray(arrayOrObject)){
            for(; i < arrayOrObject.length; i++){
                cycleBody(arrayOrObject[i], i, arrayOrObject);
            }
        }else{
            for(const propertyName in arrayOrObject){
                cycleBody(arrayOrObject[propertyName], i++, arrayOrObject);
            }
        }
    }

    public static checkConnection(){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(false);
            }, Config.checkConnectionMaxTimeout);
            for(let i = 0; i < Config.checkConnectionMaxAttempts; i++){
                fetch("https://ipv4.icanhazip.com/&time="+Date.now())
                .then(()=>{
                    resolve(true);
                })
                .catch(()=>{

                })
            }
        })
    }
}