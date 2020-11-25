import { PageCreator } from "./page-creator.js";
import { URLManager } from "./url-manager.js";


export class AutoHomeRouter {
    public desiredPage: Pages;

    constructor() {
    }

    getRoute(): IRoute {
        let route: IRoute;
        let path = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase() });
        console.log('path: ', path);
        let topLevel: string = path[0];
        if (topLevel == "user") {
            switch (path[1]) {
                case "login":
                    route.path = Pages.LOGIN;
                break;
                default:

                break;
            }

        }
        return route;
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
    path: Pages
}

export enum Pages {
    LOGIN,
    REGISTER,
    DASHBOARD,
    DEVICES,
}