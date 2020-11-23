import { PageElement } from "./page-element.js";
export class TemplateElement extends PageElement {
    constructor() {
        super();
    }
    getElement() {
        this.element.innerHTML = `
        
        `;
        return this.element;
    }
}
