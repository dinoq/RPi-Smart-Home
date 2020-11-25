export class PageComponent {
    constructor() {
        this.firebase = firebase;
        this.element = document.createElement("div");
        this.initElement();
    }
    unmountComponent() {
        this.parent.removeChild(this.element);
    }
    mountComponent(parentID, replaceContent = true) {
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
