import { ErrorDialog } from "./components/dialogs/error-dialog.js";
import { LoginComponent } from "./components/forms/login-component.js";
import { HeaderComponent } from "./components/headers/header-component.js";
import { MenuIcon, MenuItemsContainer } from "./components/menu/hamburger-menu.js";
import { MenuItem } from "./components/menu/menu-item.js";
import { BaseLayout } from "./layouts/base-layout.js";
import { PageCreator } from "./app/page-creator.js";
import { PageManagerComponent } from "./app/page-manager.js";
import { HomePage } from "./pages/home-page.js";
import { RoomCard, RoomDevice, RoomSensor, Slider } from "./layouts/room-card.js";
import { VerticalStack } from "./layouts/vertical-stack.js";
import { HorizontalStack } from "./layouts/horizontal-stack.js";
import { BaseComponent } from "./components/component.js";
import { SettingsPage } from "./pages/settings-page.js";
import { List, ListItem } from "./layouts/list-component.js";
import { Icon } from "./components/others/app-icon.js";
import { TabLayout } from "./layouts/tab-layout.js";
import { BaseDetail, DetailRow, SlidableImg } from "./layouts/detail-component.js";
import { YesNoCancelDialog } from "./components/dialogs/yes-no-cancel-dialog.js";
import { LoaderComponent } from "./components/others/loader.js";
import { OneOptionDialog } from "./components/dialogs/cancel-dialog.js";
import { RegistrationComponent } from "./components/forms/registration-component.js";
import { RegistrationPage } from "./pages/registration-page.js";
import { PairComponent } from "./components/forms/pair-component.js";
import { LoginPage } from "./pages/login-page.js";
import { PairPage } from "./pages/pair-page.js";
import { ChoiceDialog } from "./components/dialogs/choice-dialog.js";
import { SettingsDetail } from "./layouts/settings-detail.js";
import { AutomationDetail } from "./layouts/automation-detail.js";
import { AutomationsPage } from "./pages/automations-page.js";

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
        let components: Array<any> = [
            BaseComponent,

            ErrorDialog,            
            YesNoCancelDialog,  
            OneOptionDialog,
            
            LoginComponent,
            LoginPage,
            RegistrationPage,
            RegistrationComponent,
            BaseLayout,
            PageManagerComponent,
            HeaderComponent,
            MenuItem,
            MenuItemsContainer,

            HomePage,
            RoomCard,
            VerticalStack,
            HorizontalStack,
            RoomDevice,
            Slider,
            MenuIcon,
            RoomSensor,
            Icon,
            LoaderComponent,

            SettingsPage,
            List,
            ListItem,
            BaseDetail,
            SettingsDetail,
            AutomationDetail,
            DetailRow,
            TabLayout,
            SlidableImg,

            AutomationsPage,

            PairComponent,
            PairPage,

            ChoiceDialog,
            
        ];

        if(customElements.get("login-component") == undefined){
            for(const component of components){
                component.defineComponent();
            }
        }
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