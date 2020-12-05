import { AbstractPageComponent } from "./page-component.js";
export class ExampleComponent extends AbstractPageComponent {
    constructor() {
        super();
    }
}
customElements.define("template-component", ExampleComponent);
