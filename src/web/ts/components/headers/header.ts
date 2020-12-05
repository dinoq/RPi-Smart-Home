import { PageComponent } from "../page-component.js";

export class HeaderComponent extends PageComponent{
    constructor(){
        super();
    }
}

customElements.define("header-component", HeaderComponent);