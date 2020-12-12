import { Component, componentProperties } from "../component.js";

export class HeaderComponent extends Component{
    static tagName = "header-component";
    
    constructor(componentProps?: componentProperties){
        super(componentProps);
    }
}
