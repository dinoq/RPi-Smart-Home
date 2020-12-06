export class Config {
    static evaluateCondition(condition) {
        return (condition || Config.showAll) && Config.showAnything;
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
Config.showAll = false; // Switch to true for debugging all errors
Config.showAnything = true; //Switch to false for production
// Display errors
Config.showObservedAttrNotDefined = Config.evaluateCondition(false);
Config.showMethodNotImplemented = Config.evaluateCondition(true);
Config.showConnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
