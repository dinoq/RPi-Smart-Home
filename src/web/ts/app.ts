import { ErrorDialog } from "./components/dialogs/error-dialog.js";
import { LoginComponent } from "./components/forms/login-form.js";
import { HeaderComponent } from "./components/headers/header-component.js";
import { MenuItemsContainer } from "./components/menus/base-menu.js";
import { HamburgerMenu } from "./components/menus/hamburger-menu.js";
import { MenuItem } from "./components/menus/menu-item.js";
import { BlankPage } from "./components/pages/blank-page.js";
import { UnknownPageError } from "./errors/system-errors/uknown-page-error.js";
import { UndefinedPageError } from "./errors/system-errors/undefined-page-error.js";
import { BaseLayout } from "./layouts/base-layout.js";
import { PageCreator, PageElements } from "./utils/page-creator.js";
import { Effects, PageManager, PageManagerComponent } from "./utils/page-manager.js";
import { AppRouter, IRoute, Pages } from "./utils/app-router.js";
import { URLManager } from "./utils/url-manager.js";
import { LoginPage } from "./components/pages/login-page.js";
import { Dashboard } from "./components/pages/dashboard-page.js";
import { HomePage } from "./components/pages/home-page.js";
import { RoomCard, RoomDevice } from "./layouts/room-card.js";
import { VerticalStack } from "./layouts/vertical-stack.js";
import { HorizontalStack } from "./layouts/horizontal-stack.js";

export declare var firebase: any;

export var app: null | AutoHomeApp = null;
class AutoHomeApp {
    private pageCreator: PageCreator;
    constructor() {
        this.initFirebase();
        this.registerAllComponents();

        this.pageCreator = new PageCreator();

    }
    registerAllComponents() {
        if(customElements.get("login-form") == undefined){
            ErrorDialog.defineComponent();
            LoginComponent.defineComponent();
            LoginPage.defineComponent();
            Dashboard.defineComponent();
            BaseLayout.defineComponent();
            PageManagerComponent.defineComponent();
            BlankPage.defineComponent();
            HeaderComponent.defineComponent();
            HamburgerMenu.defineComponent();
            MenuItem.defineComponent();
            MenuItemsContainer.defineComponent();
            HomePage.defineComponent();
            RoomCard.defineComponent();
            VerticalStack.defineComponent();
            HorizontalStack.defineComponent();
            RoomDevice.defineComponent();
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