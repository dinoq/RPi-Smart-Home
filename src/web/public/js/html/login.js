import { PageComponent } from "./page-element.js";
export class LoginElement extends PageComponent {
    constructor() {
        super();
        this.login = (event) => {
            console.log("DDD", this.firebase);
            event.preventDefault();
            console.log('event: ', event);
            let login = document.getElementById("login").value;
            let password = document.getElementById("password").value;
            console.log('login: ', login, password);
            if (login) {
                this.firebase.auth().signInWithEmailAndPassword(login, password)
                    .then((user) => {
                    console.log('user: ', user);
                    localStorage.setItem("logged", "true");
                    localStorage.setItem("remember", "true");
                    localStorage.setItem("login", login);
                    localStorage.setItem("password", password);
                    document.getElementById("login-form").submit();
                })
                    .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    let alertWrapper = document.getElementById("form-alert-wrapper");
                    let alert = document.getElementById("form-alert");
                    alertWrapper.style.display = "flex";
                    alert.innerText = "Nesprávné přihlašovací údaje (chyba " + errorCode + ")";
                });
            }
        };
        this.addListeners = () => {
            let lf = document.getElementById("login-form");
            let l = document.getElementById("login");
            let p = document.getElementById("password");
            lf.addEventListener('submit', this.login);
            l.addEventListener('input', this.inputChange);
            p.addEventListener('input', this.inputChange);
        };
    }
    getElement() {
        let element;
        let fin = "this.parentElement.children[0].classList.add('active-label')";
        let fout = "this.parentElement.children[0].classList.remove('active-label')";
        element = document.createElement("div");
        element.innerHTML = `
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
        return element;
    }
    mountComponent(containerID) {
        document.getElementById(containerID).innerHTML = "";
        document.getElementById(containerID).appendChild(this.getElement());
        this.addListeners();
        throw new Error("Method not implemented.");
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
