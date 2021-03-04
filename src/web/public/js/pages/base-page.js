import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
export class BasePage extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        let scrollbarWidth = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-width')); // From CSS file
        style.width = (Utils.getWindowWidth() - scrollbarWidth) + "px";
        //style.height = Config.getWindowHeight() + "px";
        //style.backgroundColor = "#e8e8e8";
    }
}
BasePage.tagName = "base-page";
