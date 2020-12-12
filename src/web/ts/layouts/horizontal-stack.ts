import { AbstractComponent, componentProperties } from "../components/component.js";

export class HorizontalStack extends AbstractComponent {
    static tagName = "horizontal-stack";
    
    constructor(layoutProps?: componentProperties) {
        super(layoutProps);
    }
    

}
