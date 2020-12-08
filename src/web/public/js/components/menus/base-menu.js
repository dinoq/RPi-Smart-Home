import { AbstractComponent } from "../page-component.js";
export class BaseMenu extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
    addMenuItem(item) {
        this.itemsContainer.appendChild(item);
    }
}
export class MenuItemsContainer extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        //this.style.width="min-content";
    }
}
