

export declare var firebase: any;

export abstract class PageComponent extends HTMLElement {
    protected firebase: any = firebase;
    protected parent: HTMLElement;
    static get observedAttributes() {
        throw new Error("observedAttributes not defined");
        return ['disabled', 'open'];//example
    }
    constructor() {
        super();
        this.initialize();
    }

    abstract initialize(): void;
    abstract addListeners(): void;
    abstract connectedCallback(): void;
    abstract disconnectedCallback(): void;
    abstract attributeChangedCallback(attrName, oldVal, newVal): void;

    unmountComponent() {
        this.parent.removeChild(this);
    }

    mountComponent(parentID: string, replaceContent: boolean = true) {
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