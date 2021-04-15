import { Firebase } from "./firebase.js";
import { URLManager } from "./url-manager.js";
export var Pages;
(function (Pages) {
    Pages[Pages["UNKNOWN"] = 0] = "UNKNOWN";
    Pages[Pages["LOGIN"] = 1] = "LOGIN";
    Pages[Pages["REGISTER"] = 2] = "REGISTER";
    Pages[Pages["HOME"] = 3] = "HOME";
    Pages[Pages["SETTINGS"] = 4] = "SETTINGS";
    Pages[Pages["PAIR_WITH_ACCOUNT"] = 5] = "PAIR_WITH_ACCOUNT";
})(Pages || (Pages = {}));
export class AppRouter {
    constructor() {
    }
    async getRoute() {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        let getParams = window.location.search.substr(1).split("=");
        let indexOfLogoutParam = getParams.indexOf("forceLogout");
        if (indexOfLogoutParam != -1 && getParams[indexOfLogoutParam + 1] == "true") {
            await Firebase.logout();
            location.replace(window.location.origin + window.location.pathname); // Go to page, but without forceLogout param!
        }
        this.route = { page: AppRouter.DEFAULT_LOGGED_PAGE, path: entirePath };
        let topLevel = pathArr[0];
        if (this.pathsEquals(topLevel, Paths.LOGIN)) {
            this.route.page = Pages.LOGIN;
        }
        else if (this.pathsEquals(topLevel, Paths.PAIR_WITH_ACCOUNT)) {
            this.route.page = Pages.PAIR_WITH_ACCOUNT;
        }
        else if (this.pathsEquals(topLevel, Paths.REGISTER)) {
            this.route.page = Pages.REGISTER;
            this.route.afterLoginPage = Pages.LOGIN;
            this.route.afterLoginPath = Paths.LOGIN;
        }
        else if (this.pathsEquals(topLevel, Paths.HOME)) {
            this.route.page = Pages.HOME;
        }
        else if (this.pathsEquals(topLevel, Paths.SETTINGS)) {
            this.route.page = Pages.SETTINGS;
        }
        else {
            this.route.page = Pages.UNKNOWN;
        }
        if (!(await Firebase.loggedIn()) && this.route.page != Pages.REGISTER) {
            if (this.route.page == Pages.LOGIN) {
                this.route.afterLoginPage = Pages.HOME;
                this.route.afterLoginPath = Paths.HOME;
            }
            else {
                this.route.afterLoginPage = this.route.page;
                this.route.afterLoginPath = this.route.path;
            }
            this.route.page = Pages.LOGIN;
            this.route.path = Paths.LOGIN;
            URLManager.replaceURL(Paths.LOGIN, "login", true);
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
    Paths["LOGIN"] = "login";
    Paths["REGISTER"] = "registrace";
    Paths["HOME"] = "domu";
    Paths["SETTINGS"] = "nastaveni";
    Paths["PAIR_WITH_ACCOUNT"] = "sparovat_ucet";
})(Paths || (Paths = {}));
