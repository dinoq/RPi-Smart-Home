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
import { BaseDetail, DetailRow, SlidableImg, ThresholdInput } from "./layouts/detail-component.js";
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
import { Firebase } from "./app/firebase.js";

export declare var firebase: any;

export var app: null | App = null;
class App {
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
            ThresholdInput
            
        ];

        if(customElements.get("login-component") == undefined){
            for(const component of components){
                component.defineComponent();
            }
        }
    }

    initFirebase(){       
        var firebaseConfig = {
            apiKey: "AIzaSyAMNdGufrEtSQzUw09i0KxiQG9NjP0hjR4",
            authDomain: "homeautomation-55256.firebaseapp.com",
            databaseURL: "https://homeautomation-55256-default-rtdb.firebaseio.com",
            projectId: "homeautomation-55256",
            storageBucket: "homeautomation-55256.appspot.com",
            messagingSenderId: "98237875458",
            appId: "1:98237875458:web:7508e37bd1ebf7e3552e1b",
            measurementId: "G-KVWKXNKSRF"
          };
          // Initialize Firebase
          firebase.initializeApp(firebaseConfig);
    }
}
window.addEventListener('load', () => {
    app = new App();
});