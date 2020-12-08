import { AbstractComponent } from "../page-component.js";
export class MenuItem extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.innerText = componentProps.text;
    }
}
