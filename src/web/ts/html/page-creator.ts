import { DashboardElement } from "./dashboard.js";
import { HeaderElement } from "./header.js";
import { LoginElement } from "./login.js";


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
                container.append(this.login.getElement());
                this.login.addListeners();
            break;
            case PageElements.DIV:

            break;
            case PageElements.DEVICES_LIST:

            break;
        }
    }

    createDashboard = ()=>{
        let header: HTMLDivElement = <HTMLDivElement>document.getElementById("header");
        header.innerHTML = "";
        header.appendChild(this.header.getElement());
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