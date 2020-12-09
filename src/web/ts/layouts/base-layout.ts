import { AbstractComponent, componentProperties } from "../components/component.js";

export class BaseLayout extends AbstractComponent {
    static tagName = "base-layout";
    
    constructor(layoutProps: componentProperties) {
        super(layoutProps);
    }
    

}
