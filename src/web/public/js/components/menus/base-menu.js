import { AbstractComponent } from "../component.js";
export class BaseMenu extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
    addMenuItem(item) {
        this.itemsContainer.appendChild(item);
    }
}
BaseMenu.tagName = "base-menu";
export class MenuItemsContainer extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        //this.style.width="min-content";
    }
}
MenuItemsContainer.tagName = "menu-items-container";
