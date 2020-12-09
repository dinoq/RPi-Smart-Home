import { componentProperties } from "../component.js";
import { BasePage } from "./base-page.js";

export class Dashboard extends BasePage{    
    static tagName = "dashboard-page";

    constructor(componentProps?: componentProperties){
        super(componentProps);
    }
}