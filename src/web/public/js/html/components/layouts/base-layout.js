import { AbstractPageComponent } from "../page-element.js";
export class BaseLayout extends AbstractPageComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.style.backgroundColor = "red";
    }
    initialize(layoutProps) {
        for (const property in layoutProps) {
            console.log('property: ', property, layoutProps[property]);
            this.style[property] = layoutProps[property];
        }
    }
    addListeners() {
        console.error("Method not implemented.");
    }
    connectedCallback() {
        console.error("Method not implemented.");
    }
    disconnectedCallback() {
        console.error("Method not implemented.");
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        console.error("Method not implemented.");
    }
}
customElements.define("base-layout", BaseLayout);
