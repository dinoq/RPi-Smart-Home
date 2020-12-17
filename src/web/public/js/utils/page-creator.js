import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { Effects, PageManager } from "./page-manager.js";
import { AppRouter, Pages, PagesKeys, Paths } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { LoginPage } from "../components/pages/login-page.js";
import { HomePage } from "../components/pages/home-page.js";
import { Firebase } from "./firebase.js";
export class PageCreator {
    constructor() {
        this.renderPage = () => {
            let route = this.router.getRoute();
            let page = route.page;
            //URLManager.setURL(route.path, "", true);
            if (Firebase.loggedIn()) {
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
        let page;
        switch (route.page) {
            case Pages.HOME:
                page = new HomePage();
                this.pageManager.addPage(page, PagesKeys.HOME);
                break;
            case Pages.CONDITIONS:
                page = new HomePage();
                this.pageManager.addPage(page, PagesKeys.CONDITIONS);
                break;
            case Pages.SETTINGS:
                page = new HomePage();
                this.pageManager.addPage(page, PagesKeys.SETTINGS);
                break;
            default:
                URLManager.replaceURL(Paths.HOME, PagesKeys.HOME);
                break;
        }
    }
    renderNotLoggedIn(route) {
        switch (route.page) {
            case Pages.LOGIN:
                if (!this.pageManager.containsPageKey("login")) {
                    let login = this.createLogin(route.afterLoginPath);
                    this.pageManager.addPage(login, "login");
                }
                this.pageManager.setActive("login", Effects.SWIPE_TO_RIGHT);
                break;
            default:
                break;
        }
        switch (route.afterLoginPage) {
            case Pages.LOGIN:
                break;
            default:
                URLManager.replaceURL(Paths.LOGIN, "login", true);
                break;
        }
    }
    createLogin(redirectAfterLogin) {
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
