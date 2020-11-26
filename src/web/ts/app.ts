import { PageCreator, PageElements } from "./html/utils/page-creator.js";
import { AutoHomeRouter, IRoute, Pages } from "./html/utils/router.js";
import { URLManager } from "./html/utils/url-manager.js";

export var app: null | AutoHomeApp = null;
class AutoHomeApp {
    private pageCreator: PageCreator;
    private router: AutoHomeRouter;
    private urlManager: URLManager;

    constructor() {
        this.pageCreator = new PageCreator();
        URLManager.registerURLChangeListener(this.renderPage);
        this.router = new AutoHomeRouter();
        this.renderPage();

        document.onclick = () => {
            URLManager.setURL("/user/login" + Math.random());
        }

    }

    renderPage = () => {
        let route: IRoute = this.router.getRoute();
        let page: Pages = route.page;
        if (page == Pages.LOGIN) {
            if(route.afterLoginPage){
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
                } else {
                    this.pageCreator.createDashboard();
                }
                break;
        }
    }
}
window.addEventListener('load', () => {
    app = new AutoHomeApp();
});