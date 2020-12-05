import { AbstractPageComponent } from "../components/page-component.js";
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
}
customElements.define("base-layout", BaseLayout);
