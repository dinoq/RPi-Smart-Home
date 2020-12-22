import { Config } from "../app/config.js";
import { AbstractComponent } from "../components/component.js";
export class BasePage extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
        //style.backgroundColor = "#e8e8e8";
    }
}
BasePage.tagName = "base-page";
