import { AbstractComponent } from "../components/component.js";
export class BaseLayout extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
}
BaseLayout.tagName = "base-layout";
