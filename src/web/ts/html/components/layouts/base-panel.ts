import { AbstractPageComponent } from "../page-element.js";

export class BaseLayout extends AbstractPageComponent {
    private layoutProperties: LayoutProperties;
    constructor(layoutProps: LayoutProperties) {
        super(layoutProps);
    }
    initialize(layoutProps: LayoutProperties): void {
        let s1="display",s2="displays";
        for(const property in layoutProps){
            if(this.style[property] != undefined){//Is CSS pproperty, thus asign it!
                this.style[property] = layoutProps[property];
            }else{//Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        this.style.backgroundColor="red";
        this.style.display="block";
    }
    addListeners(): void {
        console.error("Method not implemented.");
    }
    connectedCallback(): void {
        console.error("Method not implemented.");
    }
    disconnectedCallback(): void {
        console.error("Method not implemented.");
    }
    attributeChangedCallback(attrName: any, oldVal: any, newVal: any): void {
        console.error("Method not implemented.");
    }

}

customElements.define("base-layout", BaseLayout);

export interface LayoutProperties {
    x?: string,
    y?: string,
    width?: string,
    height?: string,
    resizable?
}