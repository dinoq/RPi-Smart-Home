import { Config } from "./config.js";
export class Utils {
    static mergeObjects(obj1, obj2) {
        let result = {};
        for (const property in obj1) {
            result[property] = obj1[property];
        }
        for (const property in obj2) {
            result[property] = obj2[property];
        }
        return result;
    }
    static pxToNumber(stringVal) {
        let number = stringVal.substring(0, stringVal.length - 2);
        return Number.parseInt(number);
    }
    static getWindowWidth(withPixelUnit = false) {
        let width = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;
        if (withPixelUnit) {
            return (width + "px");
        }
        else {
            return width;
        }
    }
    static getWindowHeight(withPixelUnit = false) {
        let height = document.documentElement.scrollHeight
            || document.body.scrollHeight
            || window.innerHeight;
        if (withPixelUnit) {
            return (height + "px");
        }
        else {
            return height;
        }
    }
    static itemIsAnyFromEnum(item, fromEnum, values) {
        return values.some(value => {
            return (fromEnum[item] == value);
        });
    }
    static forEachLoop(arrayOrObject, cycleBody) {
        if (!arrayOrObject)
            return;
        let i = 0;
        if (Array.isArray(arrayOrObject)) {
            for (; i < arrayOrObject.length; i++) {
                cycleBody(arrayOrObject[i], i, arrayOrObject);
            }
        }
        else {
            for (const propertyName in arrayOrObject) {
                cycleBody(arrayOrObject[propertyName], i++, arrayOrObject);
            }
        }
    }
    static checkConnection() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(false);
            }, Config.checkConnectionMaxTimeout);
            for (let i = 0; i < Config.checkConnectionMaxAttempts; i++) {
                fetch("https://ipv4.icanhazip.com/&time=" + Date.now())
                    .then(() => {
                    resolve(true);
                })
                    .catch(() => {
                });
            }
        });
    }
}
