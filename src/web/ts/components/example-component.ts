import { AbstractComponent, componentProperties } from "./page-component.js";

export class ExampleComponent extends AbstractComponent {
    constructor(componentProps?: componentProperties) {
        super(componentProps);
    }
    /*    
    initialize(properties?: any): void{
        new MethodNotImplementedError("initialize", this, true);
    }
    addListeners(): void{
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback(): void{
        new MethodNotImplementedError("connectedCallback", this, true);
    }
    disconnectedCallback(): void{
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal): void{
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }*/
}

//customElements.define("template-component", ExampleComponent);