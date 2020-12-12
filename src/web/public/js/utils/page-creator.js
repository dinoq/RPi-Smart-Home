import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { PageManager } from "./page-manager.js";
import { AppRouter, Pages } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { LoginPage } from "../components/pages/login-page.js";
import { HomePage } from "../components/pages/home-page.js";
export class PageCreator {
    constructor() {
        this.renderPage = () => {
            let route = this.router.getRoute();
            let page = route.page;
            //URLManager.setURL(route.path, "", true);
            if (this.router.loggedIn()) {
                if (!this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.connectComponent(document.body);
                }
                this.renderLoggedIn(route);
            }
            else {
                if (this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.disconnectComponent();
                }
                this.renderNotLoggedIn(route);
            }
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
    renderLoggedIn(route) {
        switch (route.page) {
            case Pages.HOME:
                let page = new HomePage();
                this.pageManager.addPage(page, "homepage");
                break;
            default:
                break;
        }
    }
    renderNotLoggedIn(route) {
        switch (route.page) {
            case Pages.LOGIN:
                let login = this.createLogin(route.afterLoginPath);
                this.pageManager.addPage(login, "login");
                break;
            default:
                break;
        }
    }
    createLogin(redirectAfterLogin) {
        // this.header.unmountComponent();
        /*
         this.login = new LoginComponent({});
         this.login.connectComponent(document.body);
         if(redirectAfterLogin != undefined){
             this.login.redirectAfterLogin(redirectAfterLogin);
         }*/
        let login = new LoginPage();
        login.loginForm.redirectAfterLogin(redirectAfterLogin);
        return login;
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
