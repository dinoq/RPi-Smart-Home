import { PageCreator } from "./page-creator.js";


export class AutoHomeRouter{
    constructor(){
    }

    getActualPage() : Pages{
        let path = window.location.pathname;
        console.log('path: ', path);
        let logged = localStorage.getItem("logged");
        console.log('logged: ', logged);
        if(logged){
            if(this.isLoginPath()){
                location.replace("/dashboard");
            }else if(path.toLocaleLowerCase().includes("dashboard")){
                return Pages.DASHBOARD;
            }
        }else{       
            return Pages.LOGIN;
        }

    }

    isLoginPath() : boolean{
        return window.location.pathname.toLocaleLowerCase()=="/user/login";
    }
}

export enum Pages{
    LOGIN,
    REGISTER,
    DASHBOARD,
    DEVICES,
}