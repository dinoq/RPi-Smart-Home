import { AbstractComponent, IComponentProperties } from "../components/component.js";

export class VerticalStack extends AbstractComponent {
    static tagName = "vertical-stack";
    
    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.style.display="flex";
    }
    
    pushComponents = this.appendComponents;

}
