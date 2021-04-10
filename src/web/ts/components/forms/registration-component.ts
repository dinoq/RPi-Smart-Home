import { Paths } from "../../app/app-router.js";
import { Firebase } from "../../app/firebase.js";
import { URLManager } from "../../app/url-manager.js";
import { AbstractComponent, IComponentProperties } from "../component.js";

export class RegistrationComponent extends AbstractComponent {
    static tagName = "registration-component";

    formInfo: HTMLElement = undefined;
    username: any;
    pwd: any;
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
        let fin = "this.parentElement.children[0].classList.add('active-label')";
        let fout = "this.parentElement.children[0].classList.remove('active-label')";
        this.innerHTML = `
        <div id="form-info">
            <div id="form-alert" class="alert alert-danger" role="alert">
            Chyba
            </div>
        </div>
        <div class="form-wrapper">
            <form action="/home" method="POST">
                <input autocomplete="off" name="hidden" type="text" style="display:none;">
                <div class="form-label">
                    <label class="form-name-label" for="registration-component">Registrace</label>
                </div>
                <div class="form-label">
                    <label for="registration-username" class="active-label">Email</label>
                    <input type="email" id="registration-username" name="registration-username" onfocusin=${fin} onfocusout=${fout} required autocomplete />
                </div>
                <div class="form-label">
                    <label for="registration-pwd" class="active-label">Heslo</label>
                    <input type="password" autocomplete="new-password" id="registration-pwd"  name="registration-pwd" onfocusin=${fin} onfocusout=${fout} required />
                </div>
                <div class="form-label">
                    <label for="registration-pwd" class="active-label">Heslo znovu</label>
                    <input type="password" id="registration-pwd2"  name="registration-pwd2" onfocusin=${fin} onfocusout=${fout} required />
                </div>
                <input type="submit" id="submit-register" class="btn btn-primary" value="Registrovat"/>
                <div id="form-link">
                    Již máte účet? <button>Přihlásit se!</button>
                </div>
            </form>
        </div>
        `;
        
        this.classList.add("form-component");

        
        if(Firebase.localAccess){ // Pro lokální verti neexistuje "přihlášení", ale pouze spárování (prakticky je to to samé...)
            this.querySelector("#form-link").innerHTML = `
                Již máte účet? <button>Spárovat zařízení s existujícím účtem!</button>
            `
        }
        
        this.formInfo = this.querySelector("#form-info");
        this.username = this.querySelector("#registration-username");
        this.pwd = this.querySelector("#registration-pwd");
    }


    addListeners = () => {
        let registerField = this.querySelector("form");

        registerField.addEventListener('submit', this.register);
        this.username.addEventListener('input', this.inputChange);
        this.pwd.addEventListener('input', this.inputChange);
        this.querySelector("#registration-pwd2").addEventListener('input', this.inputChange);
        
        let login = this.querySelector("#form-link");
        login.addEventListener('click', (event)=>{            
            event.preventDefault();
            if(Firebase.localAccess){ // Pro lokální verti neexistuje "přihlášení", ale pouze spárování (prakticky je to to samé...)
                URLManager.setURL(Paths.PAIR_WITH_ACCOUNT);
            }else{
                URLManager.setURL(Paths.LOGIN);
            }
        })
    }

    register = async (event: any) => {
        this.formInfo.style.display = "none";
        event.preventDefault();
        let pwd2Val: string = (<HTMLInputElement>document.getElementById("registration-pwd2")).value;
        if(this.pwd.value !== pwd2Val){
            this.formInfo.innerHTML = `            
                <div id="form-alert" class="alert alert-danger" role="alert">
                    Vyplňte hesla stejně!
                </div>
            `;
            this.formInfo.style.display = "flex";
        }else {
            try {
                let userCredential:any = await Firebase.register(this.username.value, this.pwd.value);
                // Signed in 
                var user = userCredential.user;
                this.querySelector("form").submit();
            } catch (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                let alert: HTMLDivElement = (<HTMLDivElement>document.getElementById("form-alert"));
                this.formInfo.style.display = "flex";
                this.formInfo.innerHTML = `            
                    <div id="form-alert" class="alert alert-danger" role="alert">
                        ${this.getErrorFromErrCode(errorCode)}
                    </div>
                `;
                
            }
        }
    }

    getErrorFromErrCode(errorCode){
        if(!errorCode){
            return "Neznámá chyba!";
        }
        let prefix = (errorCode.includes("invalid-email"))? "Špatný formát emailu!" : "Neznámá chyba!";
        prefix = (errorCode.includes("network-request-failed"))? "Chyba připojení!" : prefix;
        prefix = (errorCode.includes("weak-password"))? "Zvolte silnější heslo! (minimum je 6 znaků)" : prefix;
        prefix = (errorCode.includes("email-already-in-use"))? "Email je již používán jiným uživatelem!" : prefix;
        return prefix + " (chyba: " + errorCode + ")";
    }

    redirectAfterLogin(redirectAfterLogin: string) {
        (<HTMLFormElement>this.querySelector("form")).action = redirectAfterLogin;
    }

    inputChange(event: InputEvent) {
        let input: HTMLInputElement = (<HTMLInputElement>event.target);
        let label: HTMLLabelElement = (<HTMLLabelElement>input.parentElement.children[0]);

        if (input.value.length) {
            label.classList.add("permanent-active-label");
        } else {
            label.classList.remove("permanent-active-label");
        }


    }
}
