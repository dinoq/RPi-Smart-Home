import { BaseError } from "../../errors/base-error.js";
import { MethodNotImplementedError } from "../../errors/method-errors.js";
import { Paths } from "../../app/app-router.js";
import { Config } from "../../app/config.js";
import { Firebase } from "../../app/firebase.js";
import { URLManager } from "../../app/url-manager.js";
import { Utils } from "../../app/utils.js";
import { AbstractComponent, IComponentProperties } from "../component.js";
import { BaseMenu } from "./base-menu.js";
import { MenuItem } from "./menu-item.js";
import { EventManager } from "../../app/event-manager.js";

export class HamburgerMenu {
    private hamburgerIcon: MenuIcon;
    itemsContainer: MenuItemsContainer;
    componentConnected: boolean = false;

    constructor(componentProps?: IComponentProperties) {
        /*super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString()
        }));*/

        this.itemsContainer = new MenuItemsContainer();
        let titles =  HamburgerMenu.globalMenu.MENU_TITLES;     
        if(Firebase.localAccess){
            titles =  HamburgerMenu.localMenu.MENU_TITLES;       
        }
        for (const title of titles) {
            let item = new MenuItem({ innerText: title });
            this.itemsContainer.addMenuItem(item);
        }
        this.hamburgerIcon = new MenuIcon();
        this.addListeners();

    }

    disconnectComponent() {
        this.componentConnected = false;
        this.itemsContainer.disconnectComponent();
        this.hamburgerIcon.disconnectComponent();
    }
    connectToBody() {
        this.componentConnected = true;
        AbstractComponent.appendComponentsToDOMElements(document.body, [this.itemsContainer, this.hamburgerIcon]);
        this.show(false, false);
    }

    static localMenu = {
        MENU_HREFS: [
            Paths.HOME,
            Paths.SETTINGS,
            Paths.PAIR_WITH_ACCOUNT
        ],
    
        MENU_TITLES: [
            "Domů",
            "Nastavení",
            "Maximalizovat okno",
            "Spárovat server s účtem"
        ]
    }
    static globalMenu = {
        MENU_HREFS: [
            Paths.HOME,
            Paths.SETTINGS,
            Paths.LOGIN
        ],
    
        MENU_TITLES: [
            "Domů",
            "Nastavení",
            "Maximalizovat okno",
            "Odhlásit se"
        ]
    }

    toggle(animate: boolean = true) {
        let containerStyle = this.itemsContainer.style;
        if (containerStyle.left == "0px") {// showed
            this.show(false, animate);
        } else { //hidden
            this.show(true, animate);
        }
    }


    show(show: boolean = true, animate: boolean = true) {
        let containerStyle = this.itemsContainer.style;
        if (animate) {
            containerStyle.transition = "left 1s";
        }
        if (show) {
            this.hamburgerIcon.src = "img/icons/close.png";
            containerStyle.left = "0px";
        } else {
            this.hamburgerIcon.src = "img/icons/menu.png";
            containerStyle.left = -this.itemsContainer.clientWidth -
                Utils.pxToNumber(getComputedStyle(this.itemsContainer).left) + "px";
        }
        if (animate) {
            this.itemsContainer.addEventListener("transitionend", () => {
                containerStyle.transition = "";
            })
        }
    }


    //@overrride
    addListeners(): void {
        this.hamburgerIcon.addEventListener("click", () => {
            EventManager.waitIfUnsavedChanges()
                .then(() => this.toggle(true))
                .catch((err) => console.error(err))
        });
        window.addEventListener("resize", this.resize);

        //Add links
        let links: MenuItem[] = <Array<MenuItem>>Array.from(this.itemsContainer.childNodes);
        let titles =  HamburgerMenu.globalMenu.MENU_TITLES;       
        let hrefs =  HamburgerMenu.globalMenu.MENU_HREFS;       
        if(Firebase.localAccess){
            titles =  HamburgerMenu.localMenu.MENU_TITLES;       
            hrefs =  HamburgerMenu.localMenu.MENU_HREFS;       
        }
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.addEventListener("click", async () => {
                if (i == (links.length - 1)) { // Odhlásit se pro globální verzi aplikace, spárovat server s účtem pro lokální verzi
                    if(Firebase.localAccess){

                    }else{
                        await Firebase.logout();
                    }
                }
                if (titles[i] == ("Maximalizovat okno")) { // Requested fullscreen
                    if (links[i].innerText.toUpperCase().includes("MAX")) {
                        links[i].innerText = "Zmenšit okno"
                        document.documentElement.requestFullscreen();
                    } else {
                        links[i].innerText = titles[titles.length - 2];
                        document.exitFullscreen();
                    }
                } else {
                    let index = i;
                    if(index > titles.indexOf("Maximalizovat okno"))
                        index--;
                    URLManager.setURL(hrefs[index]);
                }
                this.toggle();
            });

        }

    }

    resize = () => {
        new MethodNotImplementedError("resize", this, true);
    }

}


export class MenuItemsContainer extends AbstractComponent {
    static tagName = "menu-items-container";

    private menuItems: Array<MenuItem>;
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
        //this.style.width="min-content";
    }

    addMenuItem(item: AbstractComponent) {
        this.appendChild(item);
    }

}


export class MenuIcon extends AbstractComponent {
    static tagName = "menu-icon";

    set src(val) {
        this.querySelector("img").src = val;
    }
    constructor(componentProps?: IComponentProperties) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString(),
            innerHTML: `<img src="img/icons/menu.png">`
        }));



    }
}