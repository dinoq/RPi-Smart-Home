import { AbstractComponent } from "../page-component.js";
export class BlankPage extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.resizePage();
    }
    addListeners() {
        console.log("EDIT");
    }
}
