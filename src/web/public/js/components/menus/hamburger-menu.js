import { Config } from "../../utils/config.js";
import { Utils } from "../../utils/utils.js";
import { BaseMenu } from "./base-menu.js";
export class HamburgerMenu extends BaseMenu {
    constructor(componentProps) {
        super();
        let props = {
            position: "absolute",
            transition: "all 1s",
            left: "10px",
            top: "10px",
            "z-index": Config.defaultMenuDepth.toString()
        };
        let mergedProperties = Utils.mergeObjects(componentProps, props);
        this.componentProps = mergedProperties;
        this.initializeFromProps(mergedProperties);
        this.innerHTML = HamburgerMenu.MENU_CONTENT;
        this.itemsContainer = this.getElementsByTagName("menu-items-container")[0];
        this.hamburgerIcon = this.getElementsByTagName("img")[0];
        this.hamburgerIcon.addEventListener("click", () => { this.toggle(true); });
    }
    //@overrride
    connectedCallback() {
        this.show(false, false);
    }
    addMenuItem(item) {
        super.addMenuItem(item);
        //this.style.display = "block";
    }
    toggle(animate) {
        let containerStyle = this.itemsContainer.style;
        if (containerStyle.left == "0px") { // showed
            this.show(false, animate);
        }
        else { //hidden
            this.show(true, animate);
        }
    }
    show(show = true, animate) {
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
                Utils.pxToNumber(this.componentProps.left) + "px";
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
    }
    resize() {
        console.log(Config.getWindowHeight());
    }
}
HamburgerMenu.MENU_CONTENT = `
    <img src="img/menu.png"></img>
    <menu-items-container style="display: block; position: relative; left: 0px">
        <menu-item style="display: block;">Domů</menu-item>
        <menu-item style="display: block;">Podmínky</menu-item>
        <menu-item style="display: block;">Nastavení</menu-item>
    </menu-items-container>
    `;
