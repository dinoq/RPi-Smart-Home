import { PageElement } from "./page-element.js";
export class DashboardElement extends PageElement {
    constructor() {
        super();
    }
    getElement() {
        this.element.innerHTML = `
        
        `;
        return this.element;
    }
}
