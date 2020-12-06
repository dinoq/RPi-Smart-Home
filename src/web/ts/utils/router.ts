import { BaseError } from "../errors/base-error.js";
import { UndefinedPageError } from "../errors/system-errors/undefined-page-error.js";

export enum Pages {
    UNKNOWN,
    LOGIN,
    REGISTER,
    DASHBOARD,
    DEVICES,
    HOME,
}
export class AutoHomeRouter {
    public desiredPage: Pages;
    public route: IRoute;
    constructor() {
    }

    static DEFAULT_LOGGED_PAGE = Pages.HOME;
    getRoute(): IRoute {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase() });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        
        let logged = localStorage.getItem("logged");

        this.route = {page: AutoHomeRouter.DEFAULT_LOGGED_PAGE, path: entirePath};
        let topLevel: string = pathArr[0];
        if (topLevel == "user") {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                break;
                case "register":
                    this.route.page = Pages.REGISTER;
                break;
                default:
                    this.route.path = Paths.HOME;
                    new BaseError("Page " + entirePath +" not defined!", this);
                break;
            }

        }else if(topLevel == "home"){
            this.route.page = Pages.HOME;
        }else if(topLevel == "dashboard"){
            this.route.page = Pages.DASHBOARD;
        }
        if(!logged){
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
            this.route.path = Paths.LOGIN;
        }
        return this.route;

    }



    isLoginPath(): boolean {
        return window.location.pathname.toLocaleLowerCase() == "/user/login";
    }
}

export interface IRoute{
    page: Pages,
    afterLoginPage?: Pages,
    path: string,
    afterLoginPath?: string,
}

export enum Paths{
    LOGIN="user/login",
    REGISTER="user/register",
    DASHBOARD="dashboard",
    HOME="home",
}