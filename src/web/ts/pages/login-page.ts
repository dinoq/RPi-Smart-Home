import { Config } from "../app/config.js";
import { IComponentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-component.js";
import { BasePage } from "./base-page.js";

export class LoginPage extends BasePage{
    static tagName = "login-page";

    loginForm: LoginComponent;    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
        
        this.loginForm = new LoginComponent({});
        this.appendComponents(this.loginForm);

        /*if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }*/
    }
    
}