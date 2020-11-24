import { PageComponent } from "./page-element.js";

export class DashboardElement extends PageComponent{    
    constructor(){
        super();
    }

    getElement() : HTMLDivElement{
        this.element.innerHTML = `
        
        `;
        return this.element;
    }

}