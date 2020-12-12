import { AbstractComponent, componentProperties } from "../components/component.js";

export class VerticalStack extends AbstractComponent {
    static tagName = "vertical-stack";
    
    constructor(layoutProps?: componentProperties) {
        super(layoutProps);
    }
    

}
