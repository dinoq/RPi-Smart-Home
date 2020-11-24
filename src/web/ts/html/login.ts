import { PageComponent } from "./page-element.js";

export class LoginElement extends PageComponent{
    
    constructor(){
        super();
    }

    getElement() : HTMLDivElement{
        let element : HTMLDivElement;
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

    login = (event: any)=>{
        console.log("DDD",this.firebase);
        event.preventDefault();
        console.log('event: ', event);
        let login : string = (<HTMLInputElement>document.getElementById("login")).value;
        let password : string = (<HTMLInputElement>document.getElementById("password")).value;
        console.log('login: ', login, password);
        if(login){            
            this.firebase.auth().signInWithEmailAndPassword(login, password)
            .then((user: any) => {
                console.log('user: ', user);
                localStorage.setItem("logged", "true");
                localStorage.setItem("remember", "true");
                localStorage.setItem("login", login);
                localStorage.setItem("password", password);
                (<HTMLFormElement>document.getElementById("login-form")).submit();
                
            })
            .catch((error: any) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                let alertWrapper: HTMLDivElement = (<HTMLDivElement>document.getElementById("form-alert-wrapper"));
                let alert: HTMLDivElement = (<HTMLDivElement>document.getElementById("form-alert"));
                alertWrapper.style.display = "flex";
                alert.innerText = "Nesprávné přihlašovací údaje (chyba " + errorCode + ")";
            });
        }
    }

    inputChange(event: InputEvent){
        let input: HTMLInputElement = (<HTMLInputElement>event.target);
        let label: HTMLLabelElement = (<HTMLLabelElement>input.parentElement.children[0]);
        
        if(input.value.length){
            label.classList.add("permanent-active-label");
        }else{
            label.classList.remove("permanent-active-label");
        }
        

    }
    addListeners = () => {
        document.getElementById("login-form")?.addEventListener('submit', this.login);
        document.getElementById("login")?.addEventListener('input', this.inputChange);
        document.getElementById("password")?.addEventListener('input', this.inputChange);
    }
}