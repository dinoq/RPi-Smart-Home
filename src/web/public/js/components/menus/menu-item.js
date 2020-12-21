import { AbstractComponent } from "../component.js";
export class MenuItem extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
}
MenuItem.tagName = "menu-item";
