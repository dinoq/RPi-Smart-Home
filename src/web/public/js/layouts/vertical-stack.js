import { AbstractComponent } from "../components/component.js";
export class VerticalStack extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.style.display = "flex";
    }
    pushComponent(component) {
        this.appendComponents(component);
    }
}
VerticalStack.tagName = "vertical-stack";
