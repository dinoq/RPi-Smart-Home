import { DashboardElement } from "../components/dashboard.js";
import { HeaderElement } from "../components/header.js";
import { LoginElement } from "../components/login.js";


export class PageCreator{
    private login: LoginElement;
    private dashboard: DashboardElement;
    private header: HeaderElement;
    constructor(){
        this.login = new LoginElement();
        this.dashboard = new DashboardElement();
        this.header = new HeaderElement();
    }
    

    createElement(containerId: string, elementType: PageElements, elementConfig?: elementConfig){
        let container = document.getElementById(containerId);
        if(!container)
            return;
        
        container.innerHTML = "";

        switch(elementType){
            case PageElements.LOGIN_FORM:
                this.login.mountComponent("main");
            break;
            case PageElements.DIV:

            break;
            case PageElements.DEVICES_LIST:

            break;
        }
    }

    createDashboard = ()=>{
        this.header.mountComponent("header");
    }

    createLogin(){
        this.header.unmountComponent();
        this.login.mountComponent("main");
    }
}

export enum PageElements{
    LOGIN_FORM,
    REGISTER_FORM,
    DIV,
    ROOMS_LIST,
    DEVICES_LIST
}

interface elementConfig{
    width?: number;
    height?: number;

}