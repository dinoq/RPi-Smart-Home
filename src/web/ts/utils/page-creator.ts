import { LoginComponent } from "../components/forms/login.js";
import { AbstractComponent } from "../components/page-component.js";
import { BlankPage } from "../components/pages/blank-page.js";
import { BaseLayout } from "../layouts/base-layout.js";


export class PageCreator {
    private login: LoginComponent;
    /*private dashboard: DashboardElement;
    private header: HeaderComponent;*/
    constructor() {
        /*this.dashboard = new DashboardElement();
        this.header = new HeaderComponent();*/
        let layout = new BaseLayout(
            {
                height:"20px", 
                width: "100px", 
                resizable:true,
                backgroundColor: "blue"
            });
        document.getElementById("main").appendChild(layout);
        let layout2 = new BaseLayout(
            {
                height:"200px", 
                width: "50px", 
                resizable:true,
                backgroundColor: "red"
            });
        document.getElementById("main").appendChild(layout2);
        //layout2.addPage(new BlankPage({backgroundColor: "green"}));
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
        this.login = new LoginComponent({});
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