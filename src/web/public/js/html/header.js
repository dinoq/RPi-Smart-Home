import { PageComponent } from "./page-element.js";
export class HeaderElement extends PageComponent {
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
