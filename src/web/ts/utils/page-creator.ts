import { LoginComponent } from "../components/forms/login.js";
import { HamburgerMenu } from "../components/menus/hamburger-menu.js";
import { AbstractComponent } from "../components/page-component.js";
import { BlankPage } from "../components/pages/blank-page.js";
import { BaseLayout } from "../layouts/base-layout.js";
import { PageManager } from "./page-manager.js";
import { AppRouter, IRoute, Pages } from "./app-router.js";
import { URLManager } from "./url-manager.js";


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
        if(this.router.loggedIn()){   
            if(!this.hamburgerMenu.componentConnected){
                this.hamburgerMenu.connectComponent(document.body);
            }         
        }else{
            if(this.hamburgerMenu.componentConnected){
                this.hamburgerMenu.disconnectComponent();
            }  
        }
        let route: IRoute = this.router.getRoute();
        console.log('route: ', route);
        let page: Pages = route.page;
        URLManager.setURL(route.path, "login", true);
        
        //this.ajax();
        
        switch (page) {
            case Pages.LOGIN:
                this.createLogin((route.afterLoginPath != undefined)? route.afterLoginPath: undefined);
            break;
            case Pages.UNKNOWN:                
            break;
            default:
            break;
        }
        return;
    }

    createElement(containerId: string, elementType: PageElements, elementConfig?: elementConfig) {
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

    createDashboard = () => {
        //this.header.mountComponent("header");
    }

    createLogin(redirectAfterLogin: string) {
       // this.header.unmountComponent();
        this.login = new LoginComponent({});
        this.login.connectComponent("main");
        if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
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