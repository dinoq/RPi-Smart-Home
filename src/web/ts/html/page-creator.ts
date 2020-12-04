import { DashboardElement } from "../components/dashboard.js";
import { HeaderComponent } from "../components/header.js";
import { BaseLayout } from "../components/layouts/base-panel.js";
import { LoginComponent } from "../components/login.js";


export class PageCreator {
    private login: LoginComponent;
    /*private dashboard: DashboardElement;
    private header: HeaderComponent;*/
    constructor() {
        this.login = new LoginComponent();
        /*this.dashboard = new DashboardElement();
        this.header = new HeaderComponent();*/
        let layout = new BaseLayout(
            {
                height:"200px", 
                width: "50px", 
                resizable:true
            });
        document.getElementById("main").appendChild(layout);
        console.log('layout: ', layout);
    }

    createElement(containerId: string, elementType: PageElements, elementConfig?: elementConfig) {
        let container = document.getElementById(containerId);
        if (!container)
            return;

        container.innerHTML = "";

        switch (elementType) {
            case PageElements.LOGIN_FORM:
                this.login.connectComponent("main");
                break;
            case PageElements.DIV:

                break;
            case PageElements.DEVICES_LIST:

                break;
        }
    }

    createDashboard = () => {
        //this.header.mountComponent("header");
    }

    createLogin(redirectAfterLogin: string) {
       // this.header.unmountComponent();
        this.login.connectComponent("main");
        if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }
    }
}

export enum PageElements {
    LOGIN_FORM,
    REGISTER_FORM,
    DIV,
    ROOMS_LIST,
    DEVICES_LIST
}

interface elementConfig {
    width?: number;
    height?: number;

}