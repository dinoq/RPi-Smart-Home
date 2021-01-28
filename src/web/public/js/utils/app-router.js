import { BaseError } from "../errors/base-error.js";
import { Firebase } from "./firebase.js";
export var Pages;
(function (Pages) {
    Pages[Pages["UNKNOWN"] = 0] = "UNKNOWN";
    Pages[Pages["LOGIN"] = 1] = "LOGIN";
    Pages[Pages["REGISTER"] = 2] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 3] = "DASHBOARD";
    Pages[Pages["HOME"] = 4] = "HOME";
    Pages[Pages["CONDITIONS"] = 5] = "CONDITIONS";
    Pages[Pages["SETTINGS"] = 6] = "SETTINGS";
})(Pages || (Pages = {}));
export class AppRouter {
    constructor() {
    }
    getRoute() {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        this.route = { page: AppRouter.DEFAULT_LOGGED_PAGE, path: entirePath };
        let topLevel = pathArr[0];
        if (this.pathsEquals(topLevel, Paths.USER)) {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                    break;
                case "register":
                    this.route.page = Pages.REGISTER;
                    break;
                default:
                    this.route.path = Paths.HOME;
                    new BaseError("Page " + entirePath + " not defined!", this);
                    break;
            }
        }
        else if (this.pathsEquals(topLevel, Paths.DASHBOARD)) {
            this.route.page = Pages.DASHBOARD;
        }
        else if (this.pathsEquals(topLevel, Paths.HOME)) {
            this.route.page = Pages.HOME;
        }
        else if (this.pathsEquals(topLevel, Paths.CONDITIONS)) {
            this.route.page = Pages.CONDITIONS;
        }
        else if (this.pathsEquals(topLevel, Paths.SETTINGS)) {
            this.route.page = Pages.SETTINGS;
        }
        else {
            this.route.page = Pages.UNKNOWN;
        }
        if (!Firebase.loggedIn()) {
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
            this.route.path = Paths.LOGIN;
        }
        return this.route;
    }
    isLoginPath() {
        return this.pathsEquals(window.location.pathname.toLocaleLowerCase(), Paths.LOGIN);
    }
    pathsEquals(path1, path2) {
        let pathsWithoutSlash = [path1, path2];
        for (let i = 0; i < 2; i++) { //Remove slash form begining and end, if it is there...
            let p = pathsWithoutSlash[i];
            if (p.indexOf("/") == 0) {
                p = p.substring(1);
            }
            if (p.lastIndexOf("/") == (p.length - 1)) {
                p = p.substring(0, p.length - 1);
            }
            pathsWithoutSlash[i] = p;
        }
        if (pathsWithoutSlash[0] == pathsWithoutSlash[1]) {
            return true;
        }
        return false;
    }
}
AppRouter.DEFAULT_LOGGED_PAGE = Pages.HOME;
export var Paths;
(function (Paths) {
    Paths["USER"] = "uzivatel";
    Paths["LOGIN"] = "uzivatel/login";
    Paths["REGISTER"] = "uzivatel/registrovat";
    Paths["DASHBOARD"] = "dashboard";
    Paths["HOME"] = "domu";
    Paths["CONDITIONS"] = "podminky";
    Paths["SETTINGS"] = "nastaveni";
})(Paths || (Paths = {}));
export var PagesKeys;
(function (PagesKeys) {
    PagesKeys["USER"] = "uzivatel";
    PagesKeys["LOGIN"] = "login";
    PagesKeys["REGISTER"] = "registrovat";
    PagesKeys["DASHBOARD"] = "dashboard";
    PagesKeys["HOME"] = "domu";
    PagesKeys["CONDITIONS"] = "podminky";
    PagesKeys["SETTINGS"] = "nastaveni";
})(PagesKeys || (PagesKeys = {}));
