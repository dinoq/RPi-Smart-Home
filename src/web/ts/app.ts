import { ErrorDialog } from "./components/dialogs/error-dialog.js";
import { LoginComponent } from "./components/forms/login.js";
import { HeaderComponent } from "./components/headers/header.js";
import { BlankPage } from "./components/pages/blank-page.js";
import { UnknownPageError } from "./errors/system-errors/uknown-page-error.js";
import { UndefinedPageError } from "./errors/system-errors/undefined-page-error.js";
import { BaseLayout } from "./layouts/base-layout.js";
import { PageCreator, PageElements } from "./utils/page-creator.js";
import { AutoHomeRouter, IRoute, Pages } from "./utils/router.js";
import { URLManager } from "./utils/url-manager.js";

export declare var firebase: any;

export var app: null | AutoHomeApp = null;
class AutoHomeApp {
    private pageCreator: PageCreator;
    private router: AutoHomeRouter;
    private urlManager: URLManager;

    constructor() {
        this.initFirebase();
        this.registerAllComponents();

        this.pageCreator = new PageCreator();
        URLManager.registerURLChangeListener(this.renderPage);
        this.router = new AutoHomeRouter();
        this.renderPage();

        document.onclick = () => {
            //URLManager.setURL("/user/login" + Math.random());
        }

    }
    registerAllComponents() {
        if(customElements.get("login-form") == undefined){
            customElements.define("error-dialog", ErrorDialog);
            customElements.define("login-form", LoginComponent);
            customElements.define("base-layout", BaseLayout);
            customElements.define("blank-page", BlankPage);
            customElements.define("header-component", HeaderComponent);
        }

    }

    ajax=()=>{
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                console.log('this.responseText: ', this.responseText);
            }
          };
          xhttp.open("GET", "a.php", true);
          xhttp.send();
    }

    renderPage = () => {
        let route: IRoute = this.router.getRoute();
        console.log('route: ', route);
        let page: Pages = route.page;
        URLManager.setURL(route.path, "login", true);
        
        //this.ajax();
        
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
    }

    initFirebase(){       
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