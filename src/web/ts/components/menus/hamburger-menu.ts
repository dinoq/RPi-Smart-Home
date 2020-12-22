import { BaseError } from "../../errors/base-error.js";
import { MethodNotImplementedError } from "../../errors/method-errors.js";
import { Paths } from "../../app/app-router.js";
import { Config } from "../../app/config.js";
import { Firebase } from "../../app/firebase.js";
import { URLManager } from "../../app/url-manager.js";
import { Utils } from "../../app/utils.js";
import { AbstractComponent, componentProperties } from "../component.js";
import { BaseMenu } from "./base-menu.js";
import { MenuItem } from "./menu-item.js";

export class HamburgerMenu {
    private hamburgerIcon: MenuIcon;
    itemsContainer: MenuItemsContainer;    
    componentConnected: boolean = false;

    constructor(componentProps?: componentProperties) {
        /*super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString()
        }));*/

        this.itemsContainer = new MenuItemsContainer();
        for(const title of HamburgerMenu.MENU_TITLES){
            let item = new MenuItem({innerText: title});
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

    static MENU_CONTENT = `
    <img src="img/menu.png"></img>
    <menu-items-container>
        <menu-item>Domů</menu-item>
        <menu-item>Podmínky</menu-item>
        <menu-item>Nastavení</menu-item>
        <menu-item>Odhlásit se</menu-item>
    </menu-items-container>
    `;

    static MENU_HREFS = [
        Paths.HOME,
        Paths.CONDITIONS,
        Paths.SETTINGS,
        Paths.LOGIN
    ];

    static MENU_TITLES = [
        "Domů",
        "Podmínky",
        "Nastavení",
        "Odhlásit se"
    ];

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
            this.hamburgerIcon.src = "img/close.png";
            containerStyle.left = "0px";
        } else {
            this.hamburgerIcon.src = "img/menu.png";
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
        this.hamburgerIcon.addEventListener("click", () => { this.toggle(true) });
        window.addEventListener("resize", this.resize);

        //Add links
        let links: MenuItem[] = <Array<MenuItem>>Array.from(this.itemsContainer.childNodes);
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.addEventListener("click", () => {
                if (i == (links.length - 1)) {
                    Firebase.logout();
                }
                URLManager.setURL(HamburgerMenu.MENU_HREFS[i]);
                this.toggle();
            });

        }

    }

    resize = () => {
        new MethodNotImplementedError("resize", this, true);
    }

}


export class MenuItemsContainer extends AbstractComponent{    
    static tagName = "menu-items-container";
    
    private menuItems: Array<MenuItem>;
    constructor(componentProps?: componentProperties){
        super(componentProps);
        //this.style.width="min-content";
    }

    addMenuItem(item: AbstractComponent){
        this.appendChild(item);    
    }
    
}


export class MenuIcon extends AbstractComponent{
    static tagName = "menu-icon";

    set src(val){
        this.querySelector("img").src = val;
    }
    constructor(componentProps?: componentProperties) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString(),
            position: "absolute",
            top: 0,
            innerHTML: `<img src="img/menu.png">`
        }));

        
    
    }
}