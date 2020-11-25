import { DashboardElement } from "./dashboard.js";
import { HeaderElement } from "./header.js";
import { LoginElement } from "./login.js";
export class PageCreator {
    constructor() {
        this.createDashboard = () => {
            let header = document.getElementById("header");
            header.innerHTML = "";
            header.appendChild(this.header.getElement());
        };
        this.login = new LoginElement();
        this.dashboard = new DashboardElement();
        this.header = new HeaderElement();
    }
    createElement(containerId, elementType, elementConfig) {
        let container = document.getElementById(containerId);
        if (!container)
            return;
        container.innerHTML = "";
        switch (elementType) {
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
