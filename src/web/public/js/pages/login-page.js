import { LoginComponent } from "../components/forms/login-form.js";
import { BasePage } from "./base-page.js";
export class LoginPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.loginForm = new LoginComponent({});
        this.appendComponents(this.loginForm);
        /*if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }*/
    }
}
LoginPage.tagName = "login-page";
