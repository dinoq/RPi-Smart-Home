import { ErrorDialog } from "./components/dialogs/error-dialog.js";
import { LoginComponent } from "./components/forms/login-form.js";
import { HeaderComponent } from "./components/headers/header-component.js";
import { MenuIcon, MenuItemsContainer } from "./components/menus/hamburger-menu.js";
import { MenuItem } from "./components/menus/menu-item.js";
import { BlankPage } from "./pages/blank-page.js";
import { BaseLayout } from "./layouts/base-layout.js";
import { PageCreator } from "./app/page-creator.js";
import { PageManagerComponent } from "./app/page-manager.js";
import { LoginPage } from "./pages/login-page.js";
import { HomePage } from "./pages/home-page.js";
import { RoomCard, RoomDevice, RoomSensor, Slider } from "./layouts/room-card.js";
import { VerticalStack } from "./layouts/vertical-stack.js";
import { HorizontalStack } from "./layouts/horizontal-stack.js";
import { BaseComponent } from "./components/component.js";
import { SettingsPage } from "./pages/settings-page.js";
import { FrameList, FrameListItem } from "./layouts/frame-list.js";
import { Icon } from "./components/others/app-icon.js";
import { TabLayout } from "./layouts/tab-layout.js";
import { FrameDetail, FrameDetailRow, SlidableImg } from "./layouts/frame-detail.js";
import { YesNoCancelDialog } from "./components/dialogs/yes-no-cancel-dialog.js";
import { LoaderComponent } from "./components/others/loader.js";
import { OneOptionDialog } from "./components/dialogs/cancel-dialog.js";
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
        this.initFirebase();
        this.registerAllComponents();
        this.pageCreator = new PageCreator();
    }
    registerAllComponents() {
        let components = [
            BaseComponent,
            ErrorDialog,
            YesNoCancelDialog,
            OneOptionDialog,
            LoginComponent,
            LoginPage,
            BaseLayout,
            PageManagerComponent,
            BlankPage,
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
            FrameList,
            FrameListItem,
            FrameDetail,
            FrameDetailRow,
            TabLayout,
            SlidableImg,
        ];
        if (customElements.get("login-form") == undefined) {
            for (const component of components) {
                component.defineComponent();
            }
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
