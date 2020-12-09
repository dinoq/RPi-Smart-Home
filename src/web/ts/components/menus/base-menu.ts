import { AbstractComponent, componentProperties } from "../component.js";

export class BaseMenu extends AbstractComponent{    
    static tagName = "base-menu";
    
    itemsContainer: AbstractComponent;    
    constructor(componentProps?: componentProperties){
        super(componentProps);
    }
    
    addMenuItem(item: AbstractComponent){
        this.itemsContainer.appendChild(item);    
    }
}


export class MenuItemsContainer extends AbstractComponent{    
    static tagName = "menu-items-container";
    constructor(componentProps?: componentProperties){
        super(componentProps);
        //this.style.width="min-content";
    }
    
}