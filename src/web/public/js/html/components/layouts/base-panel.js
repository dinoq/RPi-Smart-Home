import { AbstractPageComponent } from "../page-element.js";
export class BaseLayout extends AbstractPageComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
    initialize(layoutProps) {
        let s1 = "display", s2 = "displays";
        for (const property in layoutProps) {
            if (this.style[property] != undefined) { //Is CSS pproperty, thus asign it!
                this.style[property] = layoutProps[property];
            }
            else { //Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        this.style.backgroundColor = "red";
        this.style.display = "block";
    }
    addListeners() {
        console.error("Method not implemented.");
    }
    connectedCallback() {
        console.error("Method not implemented.");
    }
    disconnectedCallback() {
        console.error("Method not implemented.");
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        console.error("Method not implemented.");
    }
}
customElements.define("base-layout", BaseLayout);
