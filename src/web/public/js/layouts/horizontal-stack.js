import { AbstractComponent } from "../components/component.js";
export class HorizontalStack extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
    pushComponent(component) {
        this.appendComponents(component);
    }
}
HorizontalStack.tagName = "horizontal-stack";
