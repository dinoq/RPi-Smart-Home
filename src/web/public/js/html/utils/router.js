export class AutoHomeRouter {
    constructor() {
    }
    getRoute() {
        let route;
        let path = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        console.log('path: ', path);
        let topLevel = path[0];
        if (topLevel == "user") {
            switch (path[1]) {
                case "login":
                    route.path = Pages.LOGIN;
                    break;
                default:
                    break;
            }
        }
        return route;
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
    Pages[Pages["LOGIN"] = 0] = "LOGIN";
    Pages[Pages["REGISTER"] = 1] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 2] = "DASHBOARD";
    Pages[Pages["DEVICES"] = 3] = "DEVICES";
})(Pages || (Pages = {}));
