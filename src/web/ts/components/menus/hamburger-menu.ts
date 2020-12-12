import { BaseError } from "../../errors/base-error.js";
import { MethodNotImplementedError } from "../../errors/method-errors.js";
import { Paths } from "../../utils/app-router.js";
import { Config } from "../../utils/config.js";
import { URLManager } from "../../utils/url-manager.js";
import { Utils } from "../../utils/utils.js";
import { AbstractComponent, componentProperties } from "../component.js";
import { BaseMenu } from "./base-menu.js";
import { MenuItem } from "./menu-item.js";

export class HamburgerMenu extends BaseMenu {
    static tagName = "hamburger-menu";

    private hamburgerIcon: HTMLImageElement;

    constructor(componentProps?: componentProperties) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString()
        }));

        this.innerHTML = HamburgerMenu.MENU_CONTENT;
        this.itemsContainer = <AbstractComponent>this.getElementsByTagName("menu-items-container")[0];
        this.hamburgerIcon = <HTMLImageElement>this.getElementsByTagName("img")[0];
        this.hamburgerIcon.addEventListener("click", () => { this.toggle(true) });
    }


    static MENU_CONTENT = `
    <img src="img/menu.png"></img>
    <menu-items-container>
        <menu-item>Domů</menu-item>
        <menu-item>Podmínky</menu-item>
        <menu-item>Nastavení</menu-item>
    </menu-items-container>
    `;

    static MENU_HREFS = [
        Paths.HOME,
        Paths.CONDITIONS,
        Paths.SETTINGS
    ];

    //@overrride
    connectedCallback(): void {
        this.show(false, false);
    }

    //@overrride
    addMenuItem(item: AbstractComponent) {
        super.addMenuItem(item);
        //this.style.display = "block";
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
            this.hamburgerIcon.src = "img/close.png";
            containerStyle.left = "0px";
        } else {
            this.hamburgerIcon.src = "img/menu.png";
            containerStyle.left = -this.itemsContainer.clientWidth -
                Utils.pxToNumber(getComputedStyle(this).left) + "px";
        }
        if (animate) {
            this.itemsContainer.addEventListener("transitionend", () => {
                containerStyle.transition = "";
            })
        }
    }


    //@overrride
    addListeners(): void {
        window.addEventListener("resize", this.resize);

        //Add links
        let links: MenuItem[] = <MenuItem[]> <unknown>this.querySelectorAll("menu-item");
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            link.addEventListener("click", ()=>{
                URLManager.setURL(HamburgerMenu.MENU_HREFS[i]);
                this.toggle();
            });
            
        }

    }

    resize() {
        new MethodNotImplementedError("resize", this, true);
    }

}