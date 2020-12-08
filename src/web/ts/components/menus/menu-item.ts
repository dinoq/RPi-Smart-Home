import { AbstractComponent, componentProperties } from "../page-component.js";

export class MenuItem extends AbstractComponent{   
    constructor(componentProps?: componentProperties){
        super(componentProps);
        if(componentProps && componentProps.text)
            this.innerText = componentProps.text;
    }
    
}