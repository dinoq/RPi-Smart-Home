import { Config } from "../../utils/config.js";
import { BasePage } from "./base-page.js";
export class BlankPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
        this.innerHTML = "<div style='display:flex;justify-content: center;'><h1>" + componentProps.title + "</h1></div>";
    }
}
