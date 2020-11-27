export class PageComponent extends HTMLElement {
    constructor() {
        super();
        this.firebase = firebase;
        this.initialize();
    }
    static get observedAttributes() {
        throw new Error("observedAttributes not defined");
        return ['disabled', 'open']; //example
    }
    unmountComponent() {
        this.parent.removeChild(this);
    }
    mountComponent(parentID, replaceContent = true) {
        this.parent = document.getElementById(parentID);
        if (!this.parent)
            return;
        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        console.log(this);
        this.parent.appendChild(this);
        this.addListeners();
    }
}
//customElements.define("page-component", PageComponent);
