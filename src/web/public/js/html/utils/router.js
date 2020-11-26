export class AutoHomeRouter {
    constructor() {
    }
    getRoute() {
        this.route = { page: Pages.UNKNOWN, path: "" };
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        let topLevel = pathArr[0];
        if (topLevel == "user") {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                    this.route.path = entirePath;
                    break;
                default:
                    break;
            }
        }
        let logged = localStorage.getItem("logged");
        if (!logged) {
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
        }
        return this.route;
        /*let logged = localStorage.getItem("logged");
        let page: Pages;
        if(logged){
            if(this.isLoginPath()){
                location.replace("/dashboard");
            }else if(path.toLocaleLowerCase().includes("dashboard")){
                return Pages.DASHBOARD;
            }
        }else{
            //this.desiredPage =
            return Pages.LOGIN;
        }*/
    }
    isLoginPath() {
        return window.location.pathname.toLocaleLowerCase() == "/user/login";
    }
}
export var Pages;
(function (Pages) {
    Pages[Pages["UNKNOWN"] = 0] = "UNKNOWN";
    Pages[Pages["LOGIN"] = 1] = "LOGIN";
    Pages[Pages["REGISTER"] = 2] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 3] = "DASHBOARD";
    Pages[Pages["DEVICES"] = 4] = "DEVICES";
})(Pages || (Pages = {}));
