import { DashboardElement } from "../components/dashboard.js";
import { HeaderComponent } from "../components/header.js";
import { LoginComponent } from "../components/login.js";
export class PageCreator {
    constructor() {
        this.createDashboard = () => {
            this.header.mountComponent("header");
        };
        this.login = new LoginComponent();
        this.dashboard = new DashboardElement();
        this.header = new HeaderComponent();
    }
    redirectAfterLogin(path) {
        console.error("Method not implemented.");
    }
    createElement(containerId, elementType, elementConfig) {
        let container = document.getElementById(containerId);
        if (!container)
            return;
        container.innerHTML = "";
        switch (elementType) {
            case PageElements.LOGIN_FORM:
                this.login.mountComponent("main");
                break;
            case PageElements.DIV:
                break;
            case PageElements.DEVICES_LIST:
                break;
        }
    }
    createLogin() {
        this.header.unmountComponent();
        this.login.mountComponent("main");
    }
}
export var PageElements;
(function (PageElements) {
    PageElements[PageElements["LOGIN_FORM"] = 0] = "LOGIN_FORM";
    PageElements[PageElements["REGISTER_FORM"] = 1] = "REGISTER_FORM";
    PageElements[PageElements["DIV"] = 2] = "DIV";
    PageElements[PageElements["ROOMS_LIST"] = 3] = "ROOMS_LIST";
    PageElements[PageElements["DEVICES_LIST"] = 4] = "DEVICES_LIST";
})(PageElements || (PageElements = {}));
