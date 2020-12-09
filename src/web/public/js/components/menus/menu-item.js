import { AbstractComponent } from "../component.js";
export class MenuItem extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        if (componentProps && componentProps.text)
            this.innerText = componentProps.text;
    }
}
MenuItem.tagName = "menu-item";
