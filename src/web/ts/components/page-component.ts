import { MethodNotImplementedError } from "../errors/method-errors.js";

export declare var firebase: any;

export class PageComponent extends HTMLElement {
    protected firebase: any = firebase;
    protected parent: HTMLElement;
    public observedAttributes;
    static get observedAttributes() {
        console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
        "Will use empty array ([])\n" + 
        "See class PageCompnent for inspiration.");
        //return ['disabled', 'open'];//example
        return [];
    }
    constructor() {
        super();
    }
}
export abstract class AbstractPageComponent extends PageComponent {
    constructor(properties?: any) {
        super();
        this.initialize(properties);
    }

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
    }

    disconnectComponent() {
        this.parent.removeChild(this);
    }

    connectComponent(parentID: string, replaceContent: boolean = true) {
        this.parent = document.getElementById(parentID);
        if (!this.parent)
            return;

        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        this.parent.appendChild(this);
        this.addListeners();
    }

}

//customElements.define("page-component", PageComponent);