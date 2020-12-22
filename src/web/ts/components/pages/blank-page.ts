import { Config } from "../../app/config.js";
import { componentProperties } from "../component.js";
import { BasePage } from "./base-page.js";

export class BlankPage extends BasePage{    
    static tagName = "blank-page";
    
    constructor(componentProps?: componentProperties){
        super(componentProps);

        this.innerHTML="<div style='display:flex;justify-content: center;'><h1>" +componentProps.title + "</h1></div>";
    }
    
}