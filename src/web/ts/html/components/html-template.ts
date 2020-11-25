import { PageComponent } from "./page-element.js";

export class TemplateElement extends PageComponent {
    constructor() {
        super();
    }
    addListeners(): void {
        throw new Error("Method not implemented.");
    }
    initElement(): void {
        throw new Error("Method not implemented.");
    }
}