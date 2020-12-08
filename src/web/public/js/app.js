import { ErrorDialog } from "./components/dialogs/error-dialog.js";
import { LoginComponent } from "./components/forms/login.js";
import { HeaderComponent } from "./components/headers/header.js";
import { MenuItemsContainer } from "./components/menus/base-menu.js";
import { HamburgerMenu } from "./components/menus/hamburger-menu.js";
import { MenuItem } from "./components/menus/menu-item.js";
import { BlankPage } from "./components/pages/blank-page.js";
import { UnknownPageError } from "./errors/system-errors/uknown-page-error.js";
import { BaseLayout } from "./layouts/base-layout.js";
import { PageCreator } from "./utils/page-creator.js";
import { Effects, PageManager, PageManagerComponent } from "./utils/page-manager.js";
import { AutoHomeRouter, Pages } from "./utils/router.js";
import { URLManager } from "./utils/url-manager.js";
export var app = null;
class AutoHomeApp {
    constructor() {
        this.ajax = () => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    console.log('this.responseText: ', this.responseText);
                }
            };
            xhttp.open("GET", "a.php", true);
            xhttp.send();
        };
        this.renderPage = () => {
            let route = this.router.getRoute();
            console.log('route: ', route);
            let page = route.page;
            URLManager.setURL(route.path, "login", true);
            //this.ajax();
            switch (page) {
                case Pages.LOGIN:
                    this.pageCreator.createLogin((route.afterLoginPath != undefined) ? route.afterLoginPath : undefined);
                    break;
                case Pages.UNKNOWN:
                    throw new UnknownPageError();
                    break;
                default:
                    //throw new UndefinedPageError(Pages[page]);
                    break;
            }
            return;
        };
        this.initFirebase();
        this.registerAllComponents();
        this.pageCreator = new PageCreator();
        URLManager.registerURLChangeListener(this.renderPage);
        this.router = new AutoHomeRouter();
        this.pageManager = PageManager.getInstance();
        let l = new BlankPage({ title: "login", backgroundColor: "#f5f5f5" });
        let l2 = new BlankPage({ title: "dashboard", backgroundColor: "#cecece" });
        this.pageManager.addPage(l);
        this.pageManager.addPage(l2);
        this.pageManager.connect();
        let menu = new HamburgerMenu({ connectToParent: document.body, replaceParentContent: false });
        let li1 = new MenuItem({ text: "Odkaz1" });
        let li2 = new MenuItem({ text: "Odkaz 2 2 2" });
        menu.addMenuItem(li1);
        menu.addMenuItem(li2);
        menu.hide(true);
        setTimeout(() => {
            this.pageManager.setActive(1, Effects.SWIPE_TO_LEFT);
            setTimeout(() => {
                this.pageManager.setActive(0, Effects.SWIPE_TO_LEFT);
            }, 2000);
        }, 1000);
        this.renderPage();
        document.onclick = () => {
            //URLManager.setURL("/user/login" + Math.random());
        };
    }
    registerAllComponents() {
        if (customElements.get("login-form") == undefined) {
            customElements.define("error-dialog", ErrorDialog);
            customElements.define("login-form", LoginComponent);
            customElements.define("base-layout", BaseLayout);
            customElements.define("page-manager", PageManagerComponent);
            customElements.define("blank-page", BlankPage);
            customElements.define("header-component", HeaderComponent);
            customElements.define("hamburger-menu", HamburgerMenu);
            customElements.define("menu-item", MenuItem);
            customElements.define("menu-items-container", MenuItemsContainer);
        }
    }
    initFirebase() {
        var firebaseConfig = {
            apiKey: "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
            authDomain: "home-automation-80eec.firebaseapp.com",
            databaseURL: "https://home-automation-80eec.firebaseio.com",
            projectId: "home-automation-80eec",
            storageBucket: "home-automation-80eec.appspot.com",
            messagingSenderId: "970359498290",
            appId: "1:970359498290:web:a43e83568b9db8eb783e2b",
            measurementId: "G-YTRZ79TCJJ"
        };
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
    }
}
window.addEventListener('load', () => {
    app = new AutoHomeApp();
});
