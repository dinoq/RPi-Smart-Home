import { BaseError } from "../errors/base-error.js";
export var Pages;
(function (Pages) {
    Pages[Pages["UNKNOWN"] = 0] = "UNKNOWN";
    Pages[Pages["LOGIN"] = 1] = "LOGIN";
    Pages[Pages["REGISTER"] = 2] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 3] = "DASHBOARD";
    Pages[Pages["DEVICES"] = 4] = "DEVICES";
})(Pages || (Pages = {}));
export class AutoHomeRouter {
    constructor() {
    }
    getRoute() {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        let logged = localStorage.getItem("logged");
        this.route = { page: AutoHomeRouter.DEFAULT_LOGGED_PAGE, path: entirePath };
        let topLevel = pathArr[0];
        if (topLevel == "user") {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                    break;
                case "register":
                    this.route.page = Pages.REGISTER;
                    break;
                default:
                    this.route.path = Paths.DASHBOARD;
                    new BaseError("Page " + entirePath + " not defined!", this);
                    break;
            }
        }
        else if (topLevel == "dashboard") {
            this.route.page = Pages.DASHBOARD;
        }
        if (!logged) {
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
            this.route.path = Paths.LOGIN;
        }
        return this.route;
    }
    isLoginPath() {
        return window.location.pathname.toLocaleLowerCase() == "/user/login";
    }
}
AutoHomeRouter.DEFAULT_LOGGED_PAGE = Pages.DASHBOARD;
export var Paths;
(function (Paths) {
    Paths["LOGIN"] = "user/login";
    Paths["REGISTER"] = "user/register";
    Paths["DASHBOARD"] = "dashboard";
})(Paths || (Paths = {}));
