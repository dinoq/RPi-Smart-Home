import { Config } from "../../utils/config.js";
import { componentProperties } from "../page-component.js";
import { BasePage } from "./base-page.js";

export class BlankPage extends BasePage{    
    constructor(componentProps?: componentProperties){
        super(componentProps);

        this.innerHTML="<div style='display:flex;justify-content: center;'><h1>" +componentProps.title + "</h1></div>";
    }
    
}