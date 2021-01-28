import { AbstractComponent } from "../components/component.js";
export class VerticalStack extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.pushComponents = this.appendComponents;
        this.style.display = "flex";
    }
}
VerticalStack.tagName = "vertical-stack";
