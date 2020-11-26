import { PageCreator } from "./page-creator.js";
import { URLManager } from "./url-manager.js";


export class AutoHomeRouter {
    public desiredPage: Pages;
    public route: IRoute;
    constructor() {
    }

    getRoute(): IRoute {
        this.route = {page: Pages.UNKNOWN, path: ""};
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase() });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        
        let topLevel: string = pathArr[0];
        if (topLevel == "user") {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                    this.route.path = entirePath;
                break;
                default:

                break;
            }

        }
        let logged = localStorage.getItem("logged");
        if(!logged){
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
        }
        return this.route;
        /*let logged = localStorage.getItem("logged");
        let page: Pages;
        if(logged){
            if(this.isLoginPath()){
                location.replace("/dashboard");
            }else if(path.toLocaleLowerCase().includes("dashboard")){
                return Pages.DASHBOARD;
            }
        }else{       
            //this.desiredPage = 
            return Pages.LOGIN;
        }*/

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

export enum Pages {
    UNKNOWN,
    LOGIN,
    REGISTER,
    DASHBOARD,
    DEVICES,
}