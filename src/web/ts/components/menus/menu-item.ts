import { AbstractComponent, IComponentProperties } from "../component.js";

export class MenuItem extends AbstractComponent{  
    static tagName = "menu-item"; 
    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
    }
    
}