export class AutoHomeRouter {
    constructor() {
    }
    getActualPage() {
        let path = window.location.pathname;
        console.log('path: ', path);
        let logged = localStorage.getItem("logged");
        console.log('logged: ', logged);
        if (logged) {
            if (this.isLoginPath()) {
                location.replace("/dashboard");
            }
            else if (path.toLocaleLowerCase().includes("dashboard")) {
                return Pages.DASHBOARD;
            }
        }
        else {
            return Pages.LOGIN;
        }
    }
    isLoginPath() {
        return window.location.pathname.toLocaleLowerCase() == "/user/login";
    }
}
export var Pages;
(function (Pages) {
    Pages[Pages["LOGIN"] = 0] = "LOGIN";
    Pages[Pages["REGISTER"] = 1] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 2] = "DASHBOARD";
    Pages[Pages["DEVICES"] = 3] = "DEVICES";
})(Pages || (Pages = {}));
