import { LoginComponent } from "../components/forms/login-form.js";
import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { AbstractComponent } from "../components/component.js";
import { BlankPage } from "../components/pages/blank-page.js";
import { BaseLayout } from "../layouts/base-layout.js";
import { Effects, PageManager } from "./page-manager.js";
import { AppRouter, IRoute, Pages, PagesKeys, Paths } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { LoginPage } from "../components/pages/login-page.js";
import { Dashboard } from "../components/pages/dashboard-page.js";
import { HomePage } from "../components/pages/home-page.js";
import { Firebase } from "./firebase.js";


export class PageCreator {
    private login: LoginComponent;
    private router: AppRouter;
    private pageManager: PageManager;

    private hamburgerMenu: HamburgerMenu;
    constructor() {

        this.pageManager = <PageManager>PageManager.getInstance();
        this.hamburgerMenu = new HamburgerMenu();
        //menu.hide(true);

        this.router = new AppRouter();
        URLManager.registerURLChangeListener(this.renderPage);
        this.renderPage();
    }

    renderPage = () => {
        let route: IRoute = this.router.getRoute();
        let page: Pages = route.page;
        //URLManager.setURL(route.path, "", true);

        if (Firebase.loggedIn()) {
            if (!this.hamburgerMenu.componentConnected) {
                this.hamburgerMenu.connectComponent(document.body);
            }
            this.renderLoggedIn(route);
        } else {
            if (this.hamburgerMenu.componentConnected) {
                this.hamburgerMenu.disconnectComponent();
            }
            this.renderNotLoggedIn(route);
        }
    }

    renderLoggedIn(route: IRoute) {
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

    renderNotLoggedIn(route: IRoute) {
        switch (route.page) {
            case Pages.LOGIN:
                if(!this.pageManager.containsPageKey("login")){
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

    createDashboard = () => {
        //this.header.mountComponent("header");
    }

    createLogin(redirectAfterLogin: string) {
        let login = new LoginPage();
        login.loginForm.redirectAfterLogin(redirectAfterLogin);
        return login;
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