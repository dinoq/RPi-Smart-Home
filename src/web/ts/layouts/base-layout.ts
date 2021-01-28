import { AbstractComponent, IComponentProperties } from "../components/component.js";

export class BaseLayout extends AbstractComponent {
    static tagName = "base-layout";
    
    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
    }
    

}
