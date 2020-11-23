import { PageElement } from "./page-element.js";

export class HeaderElement extends PageElement{    
    constructor(){
        super();
    }

    getElement() : HTMLDivElement{
        this.element.innerHTML = `
            <div id="header-wrapper">

            </div>
        `;
        return this.element;
    }

}