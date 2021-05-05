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
        this.componentConnected = false;
        this.resize = () => {
            new MethodNotImplementedError("resize", this, true);
        };
        this.itemsContainer = new MenuItemsContainer();
        let titles = HamburgerMenu.globalMenu.MENU_TITLES;
        let hrefs = HamburgerMenu.globalMenu.MENU_HREFS;
        if (Firebase.localAccess) {
            titles = HamburgerMenu.localMenu.MENU_TITLES;
            hrefs = HamburgerMenu.localMenu.MENU_HREFS;
        }
        for (let i = 0; i < titles.length; i++) {
            let item = new MenuItem({ innerText: titles[i] });
            this.itemsContainer.addMenuItem(item);
        }
        this.hamburgerIcon = new MenuIcon();
        this.addListeners();
        /*let getPairedPromise = Firebase.paired;
        getPairedPromise.then((paired) => {
            if(paired){
                let itemsContainerChildren = (this.itemsContainer && this.itemsContainer.children)? Array.from(this.itemsContainer.children) : undefined;
                if(itemsContainerChildren){
                    let itemToRemove = itemsContainerChildren.find((item: HTMLElement, index, array) => {return item.innerText.includes("Spárovat")});
                    itemToRemove.remove();
                }
            }
        })*/
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
            this.hamburgerIcon.src = "img/icons/close.png";
            containerStyle.left = "0px";
        }
        else {
            this.hamburgerIcon.src = "img/icons/menu.png";
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
                .catch((err) => { });
        });
        window.addEventListener("resize", this.resize);
        //Add links
        let links = Array.from(this.itemsContainer.childNodes);
        let titles = HamburgerMenu.globalMenu.MENU_TITLES;
        let hrefs = HamburgerMenu.globalMenu.MENU_HREFS;
        if (Firebase.localAccess) {
            titles = HamburgerMenu.localMenu.MENU_TITLES;
            hrefs = HamburgerMenu.localMenu.MENU_HREFS;
        }
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.addEventListener("click", async () => {
                if (i == (links.length - 1)) { // Odhlásit se pro globální verzi aplikace, spárovat server s účtem pro lokální verzi
                    if (Firebase.localAccess) {
                    }
                    else {
                        await Firebase.logout();
                    }
                }
                if (titles[i] == ("Maximalizovat okno")) { // Requested fullscreen
                    if (links[i].innerText.toUpperCase().includes("MAX")) {
                        links[i].innerText = "Zmenšit okno";
                        document.documentElement.requestFullscreen();
                    }
                    else {
                        links[i].innerText = titles[titles.length - 2];
                        document.exitFullscreen();
                    }
                }
                else {
                    let index = i;
                    if (index > titles.indexOf("Maximalizovat okno"))
                        index--;
                    URLManager.setURL(hrefs[index]);
                }
                this.toggle();
            });
        }
    }
}
HamburgerMenu.localMenu = {
    MENU_HREFS: [
        Paths.HOME,
        Paths.SETTINGS,
        Paths.AUTOMATIONS,
        Paths.PAIR_WITH_ACCOUNT
    ],
    MENU_TITLES: [
        "Domů",
        "Nastavení",
        "Automatizace",
        "Maximalizovat okno",
        "Spárovat server s (jiným) účtem"
    ]
};
HamburgerMenu.globalMenu = {
    MENU_HREFS: [
        Paths.HOME,
        Paths.SETTINGS,
        Paths.AUTOMATIONS,
        Paths.LOGIN
    ],
    MENU_TITLES: [
        "Domů",
        "Nastavení",
        "Automatizace",
        "Maximalizovat okno",
        "Odhlásit se"
    ]
};
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
            innerHTML: `<img src="img/icons/menu.png">`
        }));
    }
    set src(val) {
        this.querySelector("img").src = val;
    }
}
MenuIcon.tagName = "menu-icon";
