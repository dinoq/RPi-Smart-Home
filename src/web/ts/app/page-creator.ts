import { LoginComponent } from "../components/forms/login-component.js";
import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { AbstractComponent } from "../components/component.js";
import { Effects, PageManager } from "./page-manager.js";
import { AppRouter, IRoute, Pages, Paths } from "./app-router.js";
import { URLManager } from "./url-manager.js";
import { PairPage } from "../pages/pair-page.js";
import { HomePage } from "../pages/home-page.js";
import { Firebase } from "./firebase.js";
import { SettingsPage } from "../pages/settings-page.js";
import { BasePage } from "../pages/base-page.js";
import { RegistrationPage } from "../pages/registration-page.js";
import { LoginPage } from "../pages/login-page.js";
import { Utils } from "./utils.js";
import { ChoiceDialog } from "../components/dialogs/choice-dialog.js";


export class PageCreator {
    private login: LoginComponent;
    private router: AppRouter;
    private pageManager: PageManager;

    private hamburgerMenu: HamburgerMenu;
    constructor() {

        this.pageManager = <PageManager>PageManager.getInstance();
        this.hamburgerMenu = new HamburgerMenu();

        this.router = new AppRouter();
        URLManager.registerURLChangeListener(this.renderPage);
        this.renderPage();
    }

    renderPage = async () => {
        let route: IRoute = await this.router.getRoute();
        if(Firebase.localAccess){
            if(Utils.itemIsAnyFromEnum(route.page, Pages, ["LOGIN", "PAIR_WITH_ACCOUNT", "REGISTER"])){
                if(route.page == Pages.LOGIN){
                    URLManager.replaceURL(Paths.PAIR_WITH_ACCOUNT, Paths.PAIR_WITH_ACCOUNT);
                }
                if (this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.disconnectComponent();
                }
                this.renderNotLoggedIn(route);
            }else{
                if (!this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.connectToBody();
                }
                this.renderLoggedIn(route);
            }
        }else{
            if (await Firebase.loggedIn()) {
                if (!this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.connectToBody();
                }
                this.renderLoggedIn(route);
            } else {
                if (this.hamburgerMenu.componentConnected) {
                    this.hamburgerMenu.disconnectComponent();
                }
                this.renderNotLoggedIn(route);
            }
        }
    }

    renderLoggedIn(route: IRoute) {
        let page: Paths;
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

    renderNotLoggedIn(route: IRoute) {
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