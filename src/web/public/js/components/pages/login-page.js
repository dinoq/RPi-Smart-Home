import { LoginComponent } from "../forms/login.js";
import { BasePage } from "./base-page.js";
export class LoginPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.loginForm = new LoginComponent({});
        this.appendChild(this.loginForm);
        /*if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }*/
    }
}
LoginPage.tagName = "login-page";
