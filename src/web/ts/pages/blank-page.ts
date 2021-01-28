import { Config } from "../app/config.js";
import { IComponentProperties } from "../components/component.js";
import { BasePage } from "./base-page.js";

export class BlankPage extends BasePage{    
    static tagName = "blank-page";
    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
    }
    
}