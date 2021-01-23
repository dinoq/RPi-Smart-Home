import { MethodNotImplementedError } from "../../errors/method-errors.js";
import { Paths } from "../../app/app-router.js";
import { Config } from "../../app/config.js";
import { Firebase } from "../../app/firebase.js";
import { URLManager } from "../../app/url-manager.js";
import { Utils } from "../../app/utils.js";
import { AbstractComponent } from "../component.js";
import { MenuItem } from "./menu-item.js";
import { EventManager } from "../../app/event-manager.js";
export class HamburgerMenu {
    constructor(componentProps) {
        /*super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString()
        }));*/
        this.componentConnected = false;
        this.resize = () => {
            new MethodNotImplementedError("resize", this, true);
        };
        this.itemsContainer = new MenuItemsContainer();
        for (const title of HamburgerMenu.MENU_TITLES) {
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
    toggle(animate = true) {
        let containerStyle = this.itemsContainer.style;
        if (containerStyle.left == "0px") { // showed
            this.show(false, animate);
        }
        else { //hidden
            this.show(true, animate);
        }
    }
    show(show = true, animate = true) {
        let containerStyle = this.itemsContainer.style;
        if (animate) {
            containerStyle.transition = "left 1s";
        }
        if (show) {
            this.hamburgerIcon.src = "img/close.png";
            containerStyle.left = "0px";
        }
        else {
            this.hamburgerIcon.src = "img/menu.png";
            containerStyle.left = -this.itemsContainer.clientWidth -
                Utils.pxToNumber(getComputedStyle(this.itemsContainer).left) + "px";
        }
        if (animate) {
            this.itemsContainer.addEventListener("transitionend", () => {
                containerStyle.transition = "";
            });
        }
    }
    //@overrride
    addListeners() {
        this.hamburgerIcon.addEventListener("click", () => {
            EventManager.waitIfUnsavedChanges()
                .then(() => this.toggle(true))
                .catch((err) => console.error(err));
        });
        window.addEventListener("resize", this.resize);
        //Add links
        let links = Array.from(this.itemsContainer.childNodes);
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.addEventListener("click", () => {
                if (i == (links.length - 1)) {
                    Firebase.logout();
                }
                if (i == (links.length - 2)) { // Requested fullscreen
                    if (links[i].innerText.toUpperCase().includes("MAX")) {
                        links[i].innerText = "Zmenšit okno";
                        document.documentElement.requestFullscreen();
                    }
                    else {
                        links[i].innerText = HamburgerMenu.MENU_TITLES[HamburgerMenu.MENU_TITLES.length - 2];
                        document.exitFullscreen();
                    }
                }
                else {
                    URLManager.setURL(HamburgerMenu.MENU_HREFS[i]);
                }
                this.toggle();
            });
        }
    }
}
HamburgerMenu.MENU_HREFS = [
    Paths.HOME,
    Paths.SETTINGS,
    Paths.LOGIN
];
HamburgerMenu.MENU_TITLES = [
    "Domů",
    "Nastavení",
    "Maximalizovat okno",
    "Odhlásit se"
];
export class MenuItemsContainer extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        //this.style.width="min-content";
    }
    addMenuItem(item) {
        this.appendChild(item);
    }
}
MenuItemsContainer.tagName = "menu-items-container";
export class MenuIcon extends AbstractComponent {
    constructor(componentProps) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString(),
            innerHTML: `<img src="img/menu.png">`
        }));
    }
    set src(val) {
        this.querySelector("img").src = val;
    }
}
MenuIcon.tagName = "menu-icon";
