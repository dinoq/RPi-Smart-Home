import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { Effects, PageManager } from "./page-manager.js";
import { AppRouter, Pages, PagesKeys, Paths } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { LoginPage } from "../pages/login-page.js";
import { HomePage } from "../pages/home-page.js";
import { Firebase } from "./firebase.js";
import { SettingsPage } from "../pages/settings-page.js";
import { RegistrationPage } from "../pages/registration-page.js";
export class PageCreator {
    constructor() {
        this.renderPage = () => {
            let route = this.router.getRoute();
            let page = route.page;
            if (Firebase.loggedIn()) {
                if (!this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.connectToBody();
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
        this.pageManager = PageManager.getInstance();
        this.hamburgerMenu = new HamburgerMenu();
        this.router = new AppRouter();
        URLManager.registerURLChangeListener(this.renderPage);
        this.renderPage();
    }
    renderLoggedIn(route) {
        let page;
        switch (route.page) {
            case Pages.SETTINGS:
                page = PagesKeys.SETTINGS;
                this.pageManager.addPage(new SettingsPage(), PagesKeys.SETTINGS);
                break;
            case Pages.HOME:
                page = PagesKeys.HOME;
                this.pageManager.addPage(new HomePage(), PagesKeys.HOME);
                break;
            default: // similar to home, but replace URL!
                page = PagesKeys.HOME;
                this.pageManager.addPage(new HomePage(), PagesKeys.HOME);
                URLManager.replaceURL(Paths.HOME, PagesKeys.HOME);
                break;
        }
        this.pageManager.setActive(page, Effects.SWIPE_TO_RIGHT);
    }
    renderNotLoggedIn(route) {
        switch (route.page) {
            case Pages.LOGIN:
                if (!this.pageManager.containsPageKey(PagesKeys.LOGIN)) {
                    let login = new LoginPage();
                    login.loginForm.redirectAfterLogin(route.afterLoginPath);
                    this.pageManager.addPage(login, PagesKeys.LOGIN);
                }
                this.pageManager.setActive(PagesKeys.LOGIN);
                break;
            case Pages.REGISTER:
                if (!this.pageManager.containsPageKey(PagesKeys.REGISTER)) {
                    let register = new RegistrationPage();
                    this.pageManager.addPage(register, PagesKeys.REGISTER);
                }
                this.pageManager.setActive(PagesKeys.REGISTER);
                break;
            default:
                break;
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
