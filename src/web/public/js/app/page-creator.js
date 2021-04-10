import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { Effects, PageManager } from "./page-manager.js";
import { AppRouter, Pages, Paths } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { PairPage } from "../pages/pair-page.js";
import { HomePage } from "../pages/home-page.js";
import { Firebase } from "./firebase.js";
import { SettingsPage } from "../pages/settings-page.js";
import { RegistrationPage } from "../pages/registration-page.js";
import { LoginPage } from "../pages/login-page.js";
import { Utils } from "./utils.js";
export class PageCreator {
    constructor() {
        this.renderPage = async () => {
            let route = await this.router.getRoute();
            if (Firebase.localAccess) {
                if (Utils.itemIsAnyFromEnum(route.page, Pages, ["LOGIN", "PAIR_WITH_ACCOUNT", "REGISTER"])) {
                    if (this.hamburgerMenu.componentConnected) {
                        this.hamburgerMenu.disconnectComponent();
                    }
                    this.renderNotLoggedIn(route);
                }
                else {
                    if (!this.hamburgerMenu.componentConnected) {
                        this.hamburgerMenu.connectToBody();
                    }
                    this.renderLoggedIn(route);
                }
            }
            else {
                if (await Firebase.loggedIn()) {
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
                page = Paths.SETTINGS;
                this.pageManager.addPage(new SettingsPage(), Paths.SETTINGS);
                break;
            case Pages.HOME:
                page = Paths.HOME;
                this.pageManager.addPage(new HomePage(), Paths.HOME);
                break;
            default: // similar to home, but replace URL!
                page = Paths.HOME;
                this.pageManager.addPage(new HomePage(), Paths.HOME);
                URLManager.replaceURL(Paths.HOME, Paths.HOME);
                break;
        }
        this.pageManager.setActive(page, Effects.SWIPE_TO_RIGHT);
    }
    renderNotLoggedIn(route) {
        switch (route.page) {
            case Pages.LOGIN:
                if (!this.pageManager.containsPageKey(Paths.LOGIN)) {
                    let login = new LoginPage();
                    login.loginForm.redirectAfterLogin(route.afterLoginPath);
                    this.pageManager.addPage(login, Paths.LOGIN);
                }
                this.pageManager.setActive(Paths.LOGIN);
                break;
            case Pages.PAIR_WITH_ACCOUNT:
                if (!this.pageManager.containsPageKey(Paths.PAIR_WITH_ACCOUNT)) {
                    let page = new PairPage();
                    page.pairForm.redirectAfterLogin(route.afterLoginPath);
                    this.pageManager.addPage(page, Paths.PAIR_WITH_ACCOUNT);
                }
                this.pageManager.setActive(Paths.PAIR_WITH_ACCOUNT);
                break;
            case Pages.REGISTER:
                if (!this.pageManager.containsPageKey(Paths.REGISTER)) {
                    let register = new RegistrationPage();
                    this.pageManager.addPage(register, Paths.REGISTER);
                }
                this.pageManager.setActive(Paths.REGISTER);
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
