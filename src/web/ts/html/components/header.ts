import { PageComponent } from "./page-element.js";

export class HeaderComponent extends PageComponent{
    constructor(){
        super();
    }
    initialize(): void {
        console.error("Method not implemented.");
    }
    connectedCallback(): void {
        console.error("Method not implemented.");
    }
    disconnectedCallback(): void {
        console.error("Method not implemented.");
    }
    attributeChangedCallback(attrName: any, oldVal: any, newVal: any): void {
        console.error("Method not implemented.");
    }
    addListeners(): void {
        console.error("Method not implemented.");
    }
}

customElements.define("header-component", HeaderComponent);