import { MethodNotImplementedError } from "../../errors/method-errors.js";
import { Paths } from "../../utils/app-router.js";
import { Config } from "../../utils/config.js";
import { Firebase } from "../../utils/firebase.js";
import { URLManager } from "../../utils/url-manager.js";
import { Utils } from "../../utils/utils.js";
import { BaseMenu } from "./base-menu.js";
export class HamburgerMenu extends BaseMenu {
    constructor(componentProps) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": Config.defaultMenuDepth.toString()
        }));
        this.resize = () => {
            new MethodNotImplementedError("resize", this, true);
        };
        this.innerHTML = HamburgerMenu.MENU_CONTENT;
        this.itemsContainer = this.getElementsByTagName("menu-items-container")[0];
        this.hamburgerIcon = this.getElementsByTagName("img")[0];
        this.hamburgerIcon.addEventListener("click", () => { this.toggle(true); });
    }
    //@overrride
    connectedCallback() {
        this.show(false, false);
    }
    //@overrride
    addMenuItem(item) {
        super.addMenuItem(item);
        //this.style.display = "block";
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
                Utils.pxToNumber(getComputedStyle(this).left) + "px";
        }
        if (animate) {
            this.itemsContainer.addEventListener("transitionend", () => {
                containerStyle.transition = "";
            });
        }
    }
    //@overrride
    addListeners() {
        window.addEventListener("resize", this.resize);
        //Add links
        let links = this.querySelectorAll("menu-item");
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
}
HamburgerMenu.tagName = "hamburger-menu";
HamburgerMenu.MENU_CONTENT = `
    <img src="img/menu.png"></img>
    <menu-items-container>
        <menu-item>Domů</menu-item>
        <menu-item>Podmínky</menu-item>
        <menu-item>Nastavení</menu-item>
        <menu-item>Odhlásit se</menu-item>
    </menu-items-container>
    `;
HamburgerMenu.MENU_HREFS = [
    Paths.HOME,
    Paths.CONDITIONS,
    Paths.SETTINGS,
    Paths.LOGIN
];
