import { PageCreator, PageElements } from "./html/page-creator.js";
import {AutoHomeRouter, Pages} from "./html/router.js";

export var app : null | AutoHomeApp = null;
class AutoHomeApp{
    private pageCreator: PageCreator;
    constructor(){
        this.pageCreator = new PageCreator();
        this.createPageElements();
    }

    renderPage(){

    }
    createPageElements(){
        let router = new AutoHomeRouter();
        let page : Pages = router.getActualPage();
        switch(page){
            case Pages.LOGIN:
                if(!router.isLoginPath()){
                    window.history.pushState("login", "login", "/user/login");
                }
                this.pageCreator.createElement("main", PageElements.LOGIN_FORM);
                
            break;
            case Pages.DASHBOARD:
                this.pageCreator.createDashboard();
            break;
            default:
                if(!router.isLoginPath()){
                    location.replace("/user/login");
                }else{
                    this.pageCreator.createDashboard();
                }
            break;
        }
    }
}
window.addEventListener('load', () => {
    app = new AutoHomeApp();
});