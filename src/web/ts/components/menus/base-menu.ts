import { AbstractComponent, componentProperties } from "../page-component.js";

export class BaseMenu extends AbstractComponent{    
    itemsContainer: AbstractComponent;    
    constructor(componentProps: componentProperties){
        super(componentProps);
        this.itemsContainer = new MenuItemsContainer({});
        this.appendChild(this.itemsContainer);
    }
    
    addMenuItem(item: AbstractComponent){
        this.itemsContainer.appendChild(item);    
    }
}


export class MenuItemsContainer extends AbstractComponent{    
    constructor(componentProps: componentProperties){
        super(componentProps);
        //this.style.width="min-content";
    }
    
    connectedCallback(): void{
        console.log("Ls",this.clientWidth+"px");
    }
}