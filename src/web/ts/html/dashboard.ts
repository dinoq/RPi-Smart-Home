import { PageElement } from "./page-element.js";

export class DashboardElement extends PageElement{    
    constructor(){
        super();
    }

    getElement() : HTMLDivElement{
        this.element.innerHTML = `
        
        `;
        return this.element;
    }

}