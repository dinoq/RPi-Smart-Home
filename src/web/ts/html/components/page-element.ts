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

    abstract initialize(properties?: any): void;
    abstract addListeners(): void;
    abstract connectedCallback(): void;
    abstract disconnectedCallback(): void;
    abstract attributeChangedCallback(attrName, oldVal, newVal): void;

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