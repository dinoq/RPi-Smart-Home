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
        let height = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
        if (withPixelUnit) {
            return (height + "px");
        }
        else {
            return height;
        }
    }
}
