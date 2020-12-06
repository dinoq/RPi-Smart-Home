import { Singleton } from "./singleton";

export class Config {
    public static showAll = false; // Switch to true for debugging all errors
    public static showAnything = true;  //Switch to false for production

    // Display errors
    public static showObservedAttrNotDefined = Config.evaluateCondition(false);
    public static showMethodNotImplemented = Config.evaluateCondition(true);
    public static showConnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);


    public static evaluateCondition(condition: boolean) {
        return (condition || Config.showAll) && Config.showAnything;
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