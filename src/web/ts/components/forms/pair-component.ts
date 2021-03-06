import { Paths } from "../../app/app-router.js";
import { AuthPersistence, Firebase } from "../../app/firebase.js";
import { URLManager } from "../../app/url-manager.js";
import { AbstractComponent, IComponentProperties } from "../component.js";
import { ChoiceDialog } from "../dialogs/choice-dialog.js";

export class PairComponent extends AbstractComponent {
    static tagName = "pair-component";

    formInfo: HTMLElement = undefined;
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
        let fin = "this.parentElement.children[0].classList.add('active-label')";
        let fout = "this.parentElement.children[0].classList.remove('active-label')";
        this.innerHTML = `
        <div id="form-info">
            <div id="form-alert" class="alert alert-danger" role="alert">
            Nesprávné přihlašovací údaje!
            </div>
        </div>
        <div class="form-wrapper">
            <form action="/" method="POST">
                <div class="form-label">
                    <label class="form-name-label" for="login-component">Spárovat server s účtem:</label>
                </div>
                <div class="form-label">
                    <label for="username" class="active-label">Email</label>
                    <input type="email" id="username" name="username" onfocusin=${fin} onfocusout=${fout} required autocomplete />
                </div>
                <div class="form-label">
                    <label for="password" class="active-label">Heslo</label>
                    <input type="password" id="password"  name="password" onfocusin=${fin} onfocusout=${fout} required />
                </div>
                <input type="submit" id="submit-login" class="btn btn-primary" value="Přihlásit"/>
                <div id="form-link">
                    Nemáte účet? <button>Zaregistrovat!</button>
                </div>
            </form>
        </div>
        `;

        this.classList.add("form-component");

        this.formInfo = this.querySelector("#form-info");
    }


    addListeners = () => {
        let lf = this.querySelector("form");
        let l = this.querySelector("#username");
        let p = this.querySelector("#password");

        lf.addEventListener('submit', this.login);
        l.addEventListener('input', this.inputChange);
        p.addEventListener('input', this.inputChange);

        let register = this.querySelector("#form-link button");
        register.addEventListener('click', (event) => {
            event.preventDefault();
            URLManager.setURL(Paths.REGISTER);
        })
    }

    login = async (event: any) => {
        this.formInfo.style.display = "none";
        event.preventDefault();
        let username: string = (<HTMLInputElement>document.getElementById("username")).value;
        let password: string = (<HTMLInputElement>document.getElementById("password")).value;
        try {
            let user = await Firebase.login(username, password, "none");
            if(!user){
                throw new Error();
            }
            this.querySelector("form").submit();
            /*let choiceServer = "Lokální verze (server)";
            let choiceFirebase = "Verze z internetu";
            let dialog = new ChoiceDialog("Server byl úspěšně spárován s uživatelským účtem. Zvolte, která databáze má být zachovaná: ", [choiceFirebase, choiceServer]);
            let resp = await dialog.show();
            if(resp == choiceServer){
                await Firebase.serverCall("POST", "CopyDatabaseToFirebase");
            }else{
                await Firebase.serverCall("POST", "CopyDatabaseFromFirebase");
            }*/
            
        } catch (error) {
            let errorCode = error.code;
            let alert: HTMLDivElement = (<HTMLDivElement>document.getElementById("form-alert"));
            this.formInfo.style.display = "flex";
            alert.innerText = this.getErrorFromErrCode(errorCode);
        }
    }

    getErrorFromErrCode(errorCode) {
        if (!errorCode) {
            return "Neznámá chyba!";
        }
        let prefix = (errorCode.includes("user-not-found") || errorCode.includes("wrong-password")) ? "Nesprávné přihlašovací údaje!" : "Neznámá chyba!";
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
