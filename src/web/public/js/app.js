import { PageCreator, PageElements } from "./html/utils/page-creator.js";
import { AutoHomeRouter, Pages } from "./html/utils/router.js";
import { URLManager } from "./html/utils/url-manager.js";
export var app = null;
class AutoHomeApp {
    constructor() {
        this.renderPage = () => {
            let route = this.router.getRoute();
            let page = route.page;
            if (page == Pages.LOGIN) {
                if (route.afterLoginPage) {
                    this.pageCreator.redirectAfterLogin(route.path);
                }
            }
            return;
            switch (page) {
                case Pages.LOGIN:
                    if (!this.router.isLoginPath()) {
                        window.history.pushState("login", "login", "/user/login");
                    }
                    this.pageCreator.createElement("main", PageElements.LOGIN_FORM);
                    break;
                case Pages.DASHBOARD:
                    this.pageCreator.createDashboard();
                    break;
                default:
                    if (!this.router.isLoginPath()) {
                        location.replace("/user/login");
                    }
                    else {
                        this.pageCreator.createDashboard();
                    }
                    break;
            }
        };
        this.pageCreator = new PageCreator();
        URLManager.registerURLChangeListener(this.renderPage);
        this.router = new AutoHomeRouter();
        this.renderPage();
        document.onclick = () => {
            URLManager.setURL("/user/login" + Math.random());
        };
    }
}
window.addEventListener('load', () => {
    app = new AutoHomeApp();
});
