import { PageElement } from "./page-element.js";
export class HeaderElement extends PageElement {
    constructor() {
        super();
    }
    getElement() {
        this.element.innerHTML = `
            <div id="header-wrapper">

            </div>
        `;
        return this.element;
    }
}
