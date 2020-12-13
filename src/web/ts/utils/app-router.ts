import { BaseError } from "../errors/base-error.js";
import { UndefinedPageError } from "../errors/system-errors/undefined-page-error.js";
import { Firebase } from "./firebase.js";

export enum Pages {
    UNKNOWN,
    LOGIN,
    REGISTER,
    DASHBOARD,
    HOME,
    CONDITIONS,
    SETTINGS
}
export class AppRouter {
    public desiredPage: Pages;
    public route: IRoute;
    constructor() {
    }

    static DEFAULT_LOGGED_PAGE = Pages.HOME;
    getRoute(): IRoute {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase() });
        let entirePath = window.location.pathname.toLocaleLowerCase();

        this.route = { page: AppRouter.DEFAULT_LOGGED_PAGE, path: entirePath };
        let topLevel: string = pathArr[0];
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

        } else if (this.pathsEquals(topLevel, Paths.DASHBOARD)) {
            this.route.page = Pages.DASHBOARD;
        } else if (this.pathsEquals(topLevel, Paths.HOME)) {
            this.route.page = Pages.HOME;
        }else if (this.pathsEquals(topLevel, Paths.CONDITIONS)) {
            this.route.page = Pages.CONDITIONS;
        } else if (this.pathsEquals(topLevel, Paths.SETTINGS)) {
            this.route.page = Pages.SETTINGS;
        }else{
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

    isLoginPath(): boolean {
        return this.pathsEquals(window.location.pathname.toLocaleLowerCase(), Paths.LOGIN);
    }

    pathsEquals(path1: string, path2: string) {
        let pathsWithoutSlash = [path1, path2];

        for (let i = 0; i < 2; i++) {//Remove slash form begining and end, if it is there...
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

export interface IRoute {
    page: Pages,
    afterLoginPage?: Pages,
    path: string,
    afterLoginPath?: string,
}

export enum Paths {
    USER = "uzivatel",
    LOGIN = "uzivatel/login",
    REGISTER = "uzivatel/registrovat",
    DASHBOARD = "dashboard",
    HOME = "domu",
    CONDITIONS = "podminky",
    SETTINGS = "nastaveni",
}

export enum PagesKeys{
    USER = "uzivatel",
    LOGIN = "login",
    REGISTER = "registrovat",
    DASHBOARD = "dashboard",
    HOME = "domu",
    CONDITIONS = "podminky",
    SETTINGS = "nastaveni",
}