import { MethodNotImplementedError } from "../errors/method-errors.js";
export class PageComponent extends HTMLElement {
    constructor() {
        super();
        this.firebase = firebase;
    }
    static get observedAttributes() {
        console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
            "Will use empty array ([])\n" +
            "See class PageCompnent for inspiration.");
        //return ['disabled', 'open'];//example
        return [];
    }
}
export class AbstractPageComponent extends PageComponent {
    constructor(properties) {
        super();
        this.initialize(properties);
    }
    initialize(properties) {
        new MethodNotImplementedError("initialize", this, true);
    }
    addListeners() {
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback() {
        new MethodNotImplementedError("connectedCallback", this, true);
    }
    disconnectedCallback() {
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }
    disconnectComponent() {
        this.parent.removeChild(this);
    }
    connectComponent(parentID, replaceContent = true) {
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
