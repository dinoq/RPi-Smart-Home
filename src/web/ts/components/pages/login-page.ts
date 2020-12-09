import { Config } from "../../utils/config.js";
import { componentProperties } from "../component.js";
import { LoginComponent } from "../forms/login.js";
import { BasePage } from "./base-page.js";

export class LoginPage extends BasePage{
    static tagName = "login-page";

    loginForm: LoginComponent;    
    constructor(componentProps?: componentProperties){
        super(componentProps);
        
        this.loginForm = new LoginComponent({});
        this.appendChild(this.loginForm);

        /*if(redirectAfterLogin != undefined){
            this.login.redirectAfterLogin(redirectAfterLogin);
        }*/
    }
    
}