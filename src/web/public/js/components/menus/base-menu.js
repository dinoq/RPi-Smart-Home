import { AbstractComponent } from "../page-component.js";
export class BaseMenu extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.itemsContainer = new MenuItemsContainer({});
        this.appendChild(this.itemsContainer);
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
    connectedCallback() {
        console.log("Ls", this.clientWidth + "px");
    }
}
