import { Config } from "../../utils/config.js";
import { BasePage } from "./base-page.js";
export class BlankPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
    }
}
