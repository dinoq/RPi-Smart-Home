import { RegistrationComponent } from "../components/forms/registration-form.js";
import { BasePage } from "./base-page.js";
export class RegistrationPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.registrationForm = new RegistrationComponent({});
        this.appendComponents(this.registrationForm);
    }
}
RegistrationPage.tagName = "registration-page";
