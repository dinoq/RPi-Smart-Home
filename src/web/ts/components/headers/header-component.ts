import { Component, IComponentProperties } from "../component.js";

export class HeaderComponent extends Component{
    static tagName = "header-component";
    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
    }
}
