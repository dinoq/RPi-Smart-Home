import { IComponentProperties } from "../components/component.js";
import { RegistrationComponent } from "../components/forms/registration-component.js";
import { BasePage } from "./base-page.js";

export class RegistrationPage extends BasePage{
    static tagName = "registration-page";

    registrationForm: RegistrationComponent;    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
        
        this.registrationForm = new RegistrationComponent({});
        this.appendComponents(this.registrationForm);
    }
    
}