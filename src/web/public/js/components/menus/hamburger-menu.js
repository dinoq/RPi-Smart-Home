import { Config } from "../../utils/config.js";
import { BaseMenu } from "./base-menu.js";
export class HamburgerMenu extends BaseMenu {
    constructor(componentProps) {
        super(componentProps);
        let props = {
            height: "0px",
            position: "absolute",
            transition: "all 1s",
            left: "0px",
        };
        this.initializeFromProps(props);
    }
    addMenuItem(item) {
        super.addMenuItem(item);
        //this.style.display = "block";
    }
    hide(immediately) {
        if (immediately) {
        }
        this.style.left = -this.itemsContainer.clientWidth + "px";
    }
    addListeners() {
        window.addEventListener("resize", this.resize);
    }
    resize() {
        console.log(Config.getWindowHeight());
    }
}
