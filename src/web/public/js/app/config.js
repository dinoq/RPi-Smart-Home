export class Config {
    static evaluateCondition(condition) {
        return (condition || Config.showAllErrorsAndWarnings) && Config.showAnyErrorOrWarning;
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
// Common configuration
Config.defaultTransitionTime = 1000;
// Display errors
Config.showAllErrorsAndWarnings = false; // Switch to true for debugging all errors
Config.showAnyErrorOrWarning = true; //Switch to false for production
Config.showObservedAttrNotDefined = Config.evaluateCondition(false);
Config.showMethodNotImplemented = Config.evaluateCondition(true);
Config.showConnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
Config.showDisconnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
Config.showAddListenersNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
// Z-indexes
Config.defaultMenuDepth = 100;
Config.defaultPageDepth = 50;
