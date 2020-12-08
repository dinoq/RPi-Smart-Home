import { AbstractComponent, componentProperties } from "../page-component.js";

export class BaseMenu extends AbstractComponent{    
    itemsContainer: AbstractComponent;    
    constructor(componentProps?: componentProperties){
        super(componentProps);
    }
    
    addMenuItem(item: AbstractComponent){
        this.itemsContainer.appendChild(item);    
    }
}


export class MenuItemsContainer extends AbstractComponent{    
    constructor(componentProps?: componentProperties){
        super(componentProps);
        //this.style.width="min-content";
    }
    
}