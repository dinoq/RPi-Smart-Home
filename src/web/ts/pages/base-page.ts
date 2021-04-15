import { Config } from "../app/config.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent, IComponentProperties } from "../components/component.js";

export class BasePage extends AbstractComponent{    
    static tagName = "base-page";

    constructor(componentProps?: IComponentProperties){
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        let scrollbarWidth: number = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-width')); // From CSS file
        style.width = (<number>Utils.getWindowWidth() - scrollbarWidth) + "px"; 
        //style.height = Config.getWindowHeight() + "px";
        //style.backgroundColor = "#e8e8e8";
    }
    
}