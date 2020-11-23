export class PageElement {
    constructor() {
        this.firebase = firebase;
        this.element = document.createElement("div");
    }
    getElement() {
        return this.element;
    }
}
