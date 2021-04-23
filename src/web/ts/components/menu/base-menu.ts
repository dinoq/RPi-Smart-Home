import { AbstractComponent, IComponentProperties } from "../component.js";
import { MenuItem } from "./menu-item.js";

export class BaseMenu extends AbstractComponent{    
    static tagName = "base-menu";
    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
    }
    
}

