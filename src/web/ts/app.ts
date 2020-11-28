import { UnknownPageError } from "./errors/uknown-page-error.js";
import { UndefinedPageError } from "./errors/undefined-page-error.js";
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
        console.log('route: ', route);
        let page: Pages = route.page;
        URLManager.setURL(route.path, "login", true);

        switch (page) {
            case Pages.LOGIN:
                this.pageCreator.createLogin((route.afterLoginPath != undefined)? route.afterLoginPath: undefined);
            break;
            case Pages.UNKNOWN:                
                throw new UnknownPageError();
            break;
            default:
                throw new UndefinedPageError(Pages[page]);
            break;
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