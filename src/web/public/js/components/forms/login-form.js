import { Firebase } from "../../app/firebase.js";
import { AbstractComponent } from "../component.js";
export class LoginComponent extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.addListeners = () => {
            let lf = this.querySelector("#login-form");
            let l = this.querySelector("#login");
            let p = this.querySelector("#password");
            lf.addEventListener('submit', this.login);
            l.addEventListener('input', this.inputChange);
            p.addEventListener('input', this.inputChange);
        };
        this.login = async (event) => {
            event.preventDefault();
            let login = document.getElementById("login").value;
            let password = document.getElementById("password").value;
            if (login) {
                await Firebase.login(login, password).then((user) => {
                    document.getElementById("login-form").submit();
                })
                    .catch((error) => {
                    let errorCode = error.code;
                    let alertWrapper = document.getElementById("form-alert-wrapper");
                    let alert = document.getElementById("form-alert");
                    alertWrapper.style.display = "flex";
                    let prefix = (errorCode.includes("user-not-found")
                        || errorCode.includes("wrong-password")) ? "Nesprávné přihlašovací údaje" : "Chyba autentizace";
                    alert.innerText = prefix + " (chyba: " + errorCode + ")";
                });
            }
        };
        let fin = "this.parentElement.children[0].classList.add('active-label')";
        let fout = "this.parentElement.children[0].classList.remove('active-label')";
        this.innerHTML = `
        <div id="form-alert-wrapper">
            <div id="form-alert" class="alert alert-danger" role="alert">
            Nesprávné přihlašovací údaje!
            </div>
        </div>
        <div id="form-wrapper">
            <form id="login-form" action="/dashboard" method="POST">
                <div class="form-label">
                    <label class="form-name-label" for="login-form">Přihlášení</label>
                </div>
                <div class="form-label">
                    <label for="login" class="active-label">Email</label>
                    <input type="email" id="login" onfocusin=${fin} onfocusout=${fout} required autocomplete />
                </div>
                <div class="form-label">
                    <label for="password" class="active-label">Heslo</label>
                    <input type="password" id="password" onfocusin=${fin} onfocusout=${fout} required />
                </div>
                <div class="chekbox-wrapper">
                    <input type="checkbox" id="remember" />                    
                    <label for="remember">Zapamatovat účet</label>
                </div>
                <input type="submit" id="submit-login" class="btn btn-primary" value="Přihlásit"/>
            </form>
        </div>
        `;
    }
    redirectAfterLogin(redirectAfterLogin) {
        this.querySelector("#login-form").action = redirectAfterLogin;
    }
    inputChange(event) {
        let input = event.target;
        let label = input.parentElement.children[0];
        if (input.value.length) {
            label.classList.add("permanent-active-label");
        }
        else {
            label.classList.remove("permanent-active-label");
        }
    }
}
LoginComponent.tagName = "login-form";
