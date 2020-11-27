import { PageComponent } from "./page-element.js";
export class DashboardElement extends PageComponent {
    constructor() {
        super();
    }
    initialize() {
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
    addListeners() {
        console.error("Method not implemented.");
    }
}
customElements.define("dashboard-component", DashboardElement);
