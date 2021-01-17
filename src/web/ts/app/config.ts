import { Singleton } from "./singleton";

export class Config {

    // Common configuration

    public static defaultTransitionTime = 1000;
    // Display errors
    public static showAllErrorsAndWarnings = false; // Switch to true for debugging all errors
    public static showAnyErrorOrWarning = true;  //Switch to false for production
    public static showObservedAttrNotDefined = Config.evaluateCondition(false);
    public static showMethodNotImplemented = Config.evaluateCondition(true);
    public static showConnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
    public static showDisconnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
    public static showAddListenersNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);


    public static evaluateCondition(condition: boolean) {
        return (condition || Config.showAllErrorsAndWarnings) && Config.showAnyErrorOrWarning;
    }


    // Z-indexes
    public static defaultMenuDepth = 100;
    public static defaultPageDepth = 50;
}