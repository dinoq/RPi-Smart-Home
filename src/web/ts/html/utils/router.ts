import { UndefinedPageError } from "../../errors/undefined-page-error.js";

export class AutoHomeRouter {
    public desiredPage: Pages;
    public route: IRoute;
    constructor() {
    }

    getRoute(): IRoute {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase() });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        
        this.route = {page: Pages.UNKNOWN, path: entirePath};
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
                    throw new UndefinedPageError(entirePath);
                break;
            }

        }else if(topLevel == "dashboard"){
            this.route.page = Pages.DASHBOARD;
        }
        let logged = localStorage.getItem("logged");
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
}
export enum Pages {
    UNKNOWN,
    LOGIN,
    REGISTER,
    DASHBOARD,
    DEVICES,
}