import { Config } from "../../utils/config.js";
import { AbstractComponent, componentProperties } from "../page-component.js";

export class BasePage extends AbstractComponent{    
    constructor(componentProps?: componentProperties){
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
        style.backgroundColor = "#e8e8e8";
    }
    
}