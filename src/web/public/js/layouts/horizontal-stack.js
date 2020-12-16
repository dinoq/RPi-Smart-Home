import { AbstractComponent } from "../components/component.js";
export class HorizontalStack extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.style.display = "flex";
    }
    pushComponent(component) {
        this.appendComponents(component);
    }
}
HorizontalStack.tagName = "horizontal-stack";
