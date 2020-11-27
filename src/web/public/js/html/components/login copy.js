export class C extends HTMLElement {
    constructor() {
        super();
        let a = document.createElement("div");
        this.appendChild(a);
        let p = document.createElement("p");
        p.innerText = "ASDFG";
        a.appendChild(p);
    }
}
customElements.define("custom-el", C);
