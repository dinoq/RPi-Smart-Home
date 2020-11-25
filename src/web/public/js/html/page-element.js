export class PageComponent {
    constructor() {
        this.firebase = firebase;
        this.element = document.createElement("div");
    }
    getElement() {
        return this.element;
    }
    unmountComponent() {
        throw new Error("Method not implemented.");
    }
}
