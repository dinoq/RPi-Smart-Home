import { LoginComponent } from "../components/forms/login.js";
import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { PageManager } from "./page-manager.js";
import { AppRouter, Pages } from "./app-router.js";
import { URLManager } from "./url-manager.js";
export class PageCreator {
    constructor() {
        this.renderPage = () => {
            if (this.router.loggedIn()) {
                if (!this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.connectComponent(document.body);
                }
            }
            else {
                if (this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.disconnectComponent();
                }
            }
            let route = this.router.getRoute();
            console.log('route: ', route);
            let page = route.page;
            URLManager.setURL(route.path, "login", true);
            //this.ajax();
            switch (page) {
                case Pages.LOGIN:
                    this.createLogin((route.afterLoginPath != undefined) ? route.afterLoginPath : undefined);
                    break;
                case Pages.UNKNOWN:
                    break;
                default:
                    break;
            }
            return;
        };
        this.createDashboard = () => {
            //this.header.mountComponent("header");
        };
        this.pageManager = PageManager.getInstance();
        this.hamburgerMenu = new HamburgerMenu();
        //menu.hide(true);
        this.router = new AppRouter();
        URLManager.registerURLChangeListener(this.renderPage);
        this.renderPage();
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
