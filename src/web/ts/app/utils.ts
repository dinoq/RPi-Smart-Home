import { AbstractComponent } from "../components/component";

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
        let height = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;

        if (withPixelUnit) {
            return (height + "px");
        } else {
            return height;
        }
    }
}