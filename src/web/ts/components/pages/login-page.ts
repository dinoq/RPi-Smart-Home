import { Config } from "../../app/config.js";
import { componentProperties } from "../component.js";
import { LoginComponent } from "../forms/login-form.js";
import { BasePage } from "./base-page.js";

export class LoginPage extends BasePage{
    static tagName = "login-page";

    loginForm: LoginComponent;    
    constructor(componentProps?: componentProperties){
        super(componentProps);
        
        this.loginForm = new LoginComponent({});
        this.appendComponents(this.loginForm);

        /*if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }*/
    }
    
}