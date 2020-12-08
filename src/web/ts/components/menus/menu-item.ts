import { AbstractComponent, componentProperties } from "../page-component.js";

export class MenuItem extends AbstractComponent{   
    constructor(componentProps: componentProperties){
        super(componentProps);
        this.innerText = componentProps.text;
    }
    
}