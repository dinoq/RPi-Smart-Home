import { AbstractComponent, componentProperties } from "../component.js";

export class MenuItem extends AbstractComponent{  
    static tagName = "menu-item"; 
    
    constructor(componentProps?: componentProperties){
        super(componentProps);
    }
    
}