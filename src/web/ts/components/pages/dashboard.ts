import { PageComponent } from "../page-component.js";

export class DashboardElement extends PageComponent{    
    constructor(){
        super();
    }
}

customElements.define("dashboard-component", DashboardElement);