import { AbstractComponent } from "../components/component.js";
export class HorizontalStack extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.pushComponents = this.appendComponents;
        this.style.display = "flex";
    }
}
HorizontalStack.tagName = "horizontal-stack";
