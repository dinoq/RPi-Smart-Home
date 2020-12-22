import { Config } from "../../app/config.js";
import { AbstractComponent, componentProperties } from "../component.js";

export class BasePage extends AbstractComponent{    
    static tagName = "base-page";

    constructor(componentProps?: componentProperties){
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
        //style.backgroundColor = "#e8e8e8";
    }
    
}