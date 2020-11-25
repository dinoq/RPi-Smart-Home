

export declare var firebase: any;

export abstract class PageComponent {
    protected firebase: any = firebase;
    protected element: HTMLDivElement;
    protected parent: HTMLElement;
    constructor() {
        this.element = document.createElement("div");
        this.initElement();
    }

    abstract initElement(): void;
    abstract addListeners(): void;

    unmountComponent() {
        this.parent.removeChild(this.element)
    }

    mountComponent(parentID: string, replaceContent: boolean=true) {
        this.parent = document.getElementById(parentID);
        if (!this.parent)
            return;

        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        console.log(this.element);
        this.parent.appendChild(this.element);
        this.addListeners();
    }

}