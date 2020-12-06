import { LoginComponent } from "../components/forms/login.js";
import { BaseLayout } from "../layouts/base-layout.js";
export class PageCreator {
    /*private dashboard: DashboardElement;
    private header: HeaderComponent;*/
    constructor() {
        this.createDashboard = () => {
            //this.header.mountComponent("header");
        };
        /*this.dashboard = new DashboardElement();
        this.header = new HeaderComponent();*/
        let layout = new BaseLayout({
            height: "20px",
            width: "100px",
            resizable: true,
            backgroundColor: "blue"
        });
        document.getElementById("main").appendChild(layout);
        let layout2 = new BaseLayout({
            height: "200px",
            width: "50px",
            resizable: true,
            backgroundColor: "red"
        });
        document.getElementById("main").appendChild(layout2);
        //layout2.addPage(new BlankPage({backgroundColor: "green"}));
    }
    createElement(containerId, elementType, elementConfig) {
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
    createLogin(redirectAfterLogin) {
        // this.header.unmountComponent();
        this.login = new LoginComponent({});
        this.login.connectComponent("main");
        if (redirectAfterLogin != undefined) {
            this.login.redirectAfterLogin(redirectAfterLogin);
        }
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
