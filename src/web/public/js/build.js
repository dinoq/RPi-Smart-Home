var app = null;
class AutoHomeApp {
    constructor() {
        this.ajax = () => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    console.log('this.responseText: ', this.responseText);
                }
            };
            xhttp.open("GET", "a.php", true);
            xhttp.send();
        };
        this.renderPage = () => {
            let route = this.router.getRoute();
            console.log('route: ', route);
            let page = route.page;
            URLManager.setURL(route.path, "login", true);
            //this.ajax();
            switch (page) {
                case Pages.LOGIN:
                    this.pageCreator.createLogin((route.afterLoginPath != undefined) ? route.afterLoginPath : undefined);
                    break;
                case Pages.UNKNOWN:
                    throw new UnknownPageError();
                    break;
                default:
                    //throw new UndefinedPageError(Pages[page]);
                    break;
            }
            return;
        };
        this.initFirebase();
        this.registerAllComponents();
        this.pageCreator = new PageCreator();
        URLManager.registerURLChangeListener(this.renderPage);
        this.router = new AutoHomeRouter();
        this.pageManager = PageManager.getInstance();
        let l = new BlankPage({ title: "login", backgroundColor: "#f5f5f5" });
        let l2 = new BlankPage({ title: "dashboard", backgroundColor: "#cecece" });
        this.pageManager.addPage(l);
        this.pageManager.addPage(l2);
        this.pageManager.connect();
        setTimeout(() => {
            this.pageManager.setActive(1, Effects.SWIPE_TO_LEFT);
            setTimeout(() => {
                this.pageManager.setActive(0, Effects.SWIPE_TO_LEFT);
            }, 2000);
        }, 1000);
        this.renderPage();
        document.onclick = () => {
            //URLManager.setURL("/user/login" + Math.random());
        };
    }
    registerAllComponents() {
        if (customElements.get("login-form") == undefined) {
            customElements.define("error-dialog", ErrorDialog);
            customElements.define("login-form", LoginComponent);
            customElements.define("base-layout", BaseLayout);
            customElements.define("page-manager", PageManagerComponent);
            customElements.define("blank-page", BlankPage);
            customElements.define("header-component", HeaderComponent);
        }
    }
    initFirebase() {
        var firebaseConfig = {
            apiKey: "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
            authDomain: "home-automation-80eec.firebaseapp.com",
            databaseURL: "https://home-automation-80eec.firebaseio.com",
            projectId: "home-automation-80eec",
            storageBucket: "home-automation-80eec.appspot.com",
            messagingSenderId: "970359498290",
            appId: "1:970359498290:web:a43e83568b9db8eb783e2b",
            measurementId: "G-YTRZ79TCJJ"
        };
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
    }
}
window.addEventListener('load', () => {
    app = new AutoHomeApp();
});

class Component extends HTMLElement {
    /* static _className = "";
     get className(){
         new ComponentNameNotDefinedError();
         return "";
     }*/
    constructor(componentProps) {
        try {
            super();
            this.firebase = firebase;
        }
        catch (e) {
            console.log(e.message);
            let error = e.stack.toString().substring(0, e.stack.toString().length);
            let classes = error.split("at new ").slice(1);
            classes.forEach((str, index, array) => {
                classes[index] = str.substring(0, str.indexOf(" "));
            });
            console.log(classes);
            /*
            console.log('ess: ', e.toString().substring(10,20));
            console.log('e: ', e.);
            let str = <string>e.toString().substring(10,200);
            let classes = str.split("at new");
            console.log('classes: ', classes);*/
            new CustomComponentNotDefinedError(classes);
            super();
        }
    }
    static get observedAttributes() {
        if (Config.showObservedAttrNotDefined) {
            console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
                "Will use empty array ([])\n" +
                "See class PageCompnent for inspiration.");
        }
        //return ['disabled', 'open'];//example
        return [];
    }
}
class AbstractComponent extends Component {
    constructor(componentProps) {
        super(componentProps);
        this.componentProps = componentProps;
        this.initialize(componentProps);
    }
    initialize(componentProps) {
        for (const property in componentProps) {
            if (this.style[property] != undefined) { //Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            }
            else { //Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        if (!this.style.display) { //If not set
            this.style.display = "block";
        }
    }
    addListeners() {
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback() {
        if (Config.showConnectedCallbackNotImplemented) {
            new MethodNotImplementedError("connectedCallback", this, true);
        }
    }
    disconnectedCallback() {
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }
    disconnectComponent() {
        this.parent.removeChild(this);
    }
    connectComponent(parent, replaceContent = false) {
        if (typeof parent == "string") {
            this.parent = document.getElementById(parent);
        }
        else {
            this.parent = parent;
        }
        if (!this.parent)
            return;
        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        this.parent.appendChild(this);
        this.addListeners();
    }
}
class BaseDialog extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
}
class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        this.innerHTML = `
            ${error} 
            <div class="close-btn">
                <div class="btn btn-danger">
                    close
                </div>
            </div>
        `;
        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', () => {
            this.remove();
        });
    }
}
class ExampleComponent extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
}
//customElements.define("template-component", ExampleComponent);
class LoginComponent extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.addListeners = () => {
            let lf = document.getElementById("login-form");
            let l = document.getElementById("login");
            let p = document.getElementById("password");
            lf.addEventListener('submit', this.login);
            l.addEventListener('input', this.inputChange);
            p.addEventListener('input', this.inputChange);
        };
        this.login = (event) => {
            event.preventDefault();
            let login = document.getElementById("login").value;
            let password = document.getElementById("password").value;
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
    }
    initialize(componentProps) {
        super.initialize(componentProps);
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
        document.getElementById("login-form").action = redirectAfterLogin;
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
class HeaderComponent extends Component {
    constructor(componentProps) {
        super(componentProps);
    }
}
class BasePage extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
}
class BlankPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        let style = this.style;
        style.position = "absolute";
        style.width = Config.getWindowWidth() + "px";
        style.height = Config.getWindowHeight() + "px";
        this.innerHTML = "<div style='display:flex;justify-content: center;'><h1>" + componentProps.title + "</h1></div>";
    }
}
class Dashboard extends BasePage {
    constructor(componentProps) {
        super(componentProps);
    }
}
class BaseError {
    constructor(msg = "", caller, showImmediately = true) {
        this.showInDialog = false;
        if (caller) {
            this.errMsg = "Error: '" + msg + "'\nAt class: " + caller.constructor.name;
        }
        else {
            this.errMsg = "Unknown Error";
        }
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
    show() {
        console.error(this.errMsg);
        if (this.showInDialog) {
            let stringWithBR = this.errMsg.replaceAll("\n", "<br>");
            new ErrorDialog(stringWithBR, {});
        }
    }
}
class CustomComponentNotDefinedError extends BaseError {
    constructor(errorStackClasses) {
        super("", null, false);
        this.showInDialog = true;
        let componentClassName = errorStackClasses[errorStackClasses.indexOf("PageCreator") - 1];
        this.errMsg = "Error: Component created by '" + componentClassName +
            "' class not defined (not registered as custom HTML element).\n" +
            "See 'registerAllComponents()' method of main app class (probably class '" + errorStackClasses[errorStackClasses.length - 1] + "').\n" +
            "At class: " + errorStackClasses[0];
        this.showImmediately = true;
        if (this.showImmediately) {
            this.show();
        }
    }
}
class ComponentNameNotDefinedError extends BaseError {
    constructor() {
        super("", null, false);
        this.showInDialog = false;
        this.errMsg = "Component name or className not defined!";
        this.showImmediately = true;
        if (this.showImmediately) {
            this.show();
        }
    }
}
class MethodNotImplementedError extends BaseError {
    constructor(methodName = "", caller, showImmediately) {
        super("", caller, false);
        this.showInDialog = false;
        this.errMsg = "Error: Method '" + caller.constructor.name + "." + methodName + "()' not implemented\nAt class: " + caller.constructor.name;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
}
class PageNotExistInPageManagerError extends BaseError {
    constructor(page, length, showImmediately) {
        super("", null, false);
        this.showInDialog = true;
        let p = (typeof page == "number") ? "Page with index '" + page : "Any page, instance of '" + page.constructor.name;
        let append = (typeof page == "number") ? " PageManager contains only " + length
            + " pages, so max index is " + (length - 1) + "." : "";
        this.errMsg = "Error: " + p + "' doesn't exist in PageManager." + append;
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
}
class PageAlreadyAddedToPageManagerError extends BaseError {
    constructor(page, showImmediately) {
        super("", null, false);
        this.showInDialog = true;
        this.errMsg = "Error: Any page, instance of '" + page.constructor.name + "' already added to PageManager!";
        this.showImmediately = showImmediately;
        if (showImmediately) {
            this.show();
        }
    }
}
class ExampleSystemError extends Error {
    constructor(page) {
        super("Page " + page + " not defined!"); //error message example
        this.__proto__ = Error;
        Object.setPrototypeOf(this, ExampleSystemError.prototype);
    }
}
class UnknownPageError extends Error {
    constructor() {
        super("UNKNOWN page returned!");
        this.__proto__ = Error;
        Object.setPrototypeOf(this, UnknownPageError.prototype);
    }
}
class UndefinedPageError extends Error {
    constructor(page) {
        super("Page " + page + " not defined!");
        this.__proto__ = Error;
        Object.setPrototypeOf(this, UndefinedPageError.prototype);
    }
}
class BaseLayout extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
}
class Config {
    static evaluateCondition(condition) {
        return (condition || Config.showAllErrorsAndWarnings) && Config.showAnyErrorOrWarning;
    }
    static getWindowWidth(withPixelUnit = false) {
        let width = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;
        if (withPixelUnit) {
            return (width + "px");
        }
        else {
            return width;
        }
    }
    static getWindowHeight(withPixelUnit = false) {
        let height = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
        if (withPixelUnit) {
            return (height + "px");
        }
        else {
            return height;
        }
    }
}
// Common configuration
Config.defaultTransitionTime = 1000;
// Display errors
Config.showAllErrorsAndWarnings = false; // Switch to true for debugging all errors
Config.showAnyErrorOrWarning = true; //Switch to false for production
Config.showObservedAttrNotDefined = Config.evaluateCondition(false);
Config.showMethodNotImplemented = Config.evaluateCondition(true);
Config.showConnectedCallbackNotImplemented = Config.evaluateCondition(Config.showMethodNotImplemented && false);
class PageCreator {
    /*private dashboard: DashboardElement;
    private header: HeaderComponent;*/
    constructor() {
        this.createDashboard = () => {
            //this.header.mountComponent("header");
        };
        /*this.dashboard = new DashboardElement();
        this.header = new HeaderComponent();*/
        let layout = new BaseLayout({
            height: "20px",
            width: "100px",
            resizable: true,
            backgroundColor: "blue"
        });
        document.getElementById("main").appendChild(layout);
        let layout2 = new BaseLayout({
            height: "200px",
            width: "50px",
            resizable: true,
            backgroundColor: "red"
        });
        document.getElementById("main").appendChild(layout2);
        //layout2.addPage(new BlankPage({backgroundColor: "green"}));
    }
    createElement(containerId, elementType, elementConfig) {
        let container = document.getElementById(containerId);
        if (!container)
            return;
        container.innerHTML = "";
        switch (elementType) {
            case PageElements.LOGIN_FORM:
                this.login.connectComponent("main");
                break;
            case PageElements.DIV:
                break;
            case PageElements.DEVICES_LIST:
                break;
        }
    }
    createLogin(redirectAfterLogin) {
        // this.header.unmountComponent();
        this.login = new LoginComponent({});
        this.login.connectComponent("main");
        if (redirectAfterLogin != undefined) {
            this.login.redirectAfterLogin(redirectAfterLogin);
        }
    }
}
var PageElements;
(function (PageElements) {
    PageElements[PageElements["LOGIN_FORM"] = 0] = "LOGIN_FORM";
    PageElements[PageElements["REGISTER_FORM"] = 1] = "REGISTER_FORM";
    PageElements[PageElements["DIV"] = 2] = "DIV";
    PageElements[PageElements["ROOMS_LIST"] = 3] = "ROOMS_LIST";
    PageElements[PageElements["DEVICES_LIST"] = 4] = "DEVICES_LIST";
})(PageElements || (PageElements = {}));

class Singleton {
    static getInstance() {
        if (this.instance == undefined) {
            this.instance = new this();
        }
        return this.instance;
    }
}
class PageManager extends Singleton {
    constructor() {
        super();
        this.activePageIndex = 0;
        this.activePage = null;
        this.resizePages = () => {
            this.pageManagerComponent.style.width = Config.getWindowWidth(true);
            this.pageManagerComponent.style.height = Config.getWindowHeight(true);
            this.pages.forEach((child, index, array) => {
                let childStyle = child.style;
                childStyle.width = Config.getWindowWidth(true);
                childStyle.height = Config.getWindowHeight(true);
                if (index != this.activePageIndex) {
                    childStyle.left = Config.getWindowWidth(true);
                }
            });
        };
        this.pages = new Array();
        this.pageManagerComponent = new PageManagerComponent({});
        this.resizePages();
        window.addEventListener('resize', this.resizePages);
    }
    connect() {
        this.pageManagerComponent.connectComponent(document.body);
    }
    addPage(page) {
        if (this.pages.indexOf(page) != -1) {
            new PageAlreadyAddedToPageManagerError(page, true);
            return;
        }
        this.pages.push(page);
        this.pageManagerComponent.appendChild(page);
        if (this.pages.length == 1) {
            this.activePage = page;
            page.style.left = "0px";
        }
        else {
            page.style.left = Config.getWindowWidth(true);
            //page.style.display = "none";
        }
    }
    setActive(page, effect = Effects.NONE) {
        if (typeof page == "number") {
            if (page < this.pages.length) {
                if (effect == Effects.SWIPE_TO_LEFT) {
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                    setTimeout(() => { recentActiveStyle.transition = ""; }, Config.defaultTransitionTime);
                    recentActiveStyle.left = "-" + Config.getWindowWidth(true);
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.left = Config.getWindowWidth(true);
                    setTimeout(() => {
                        actualActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                        setTimeout(() => { actualActiveStyle.transition = ""; }, Config.defaultTransitionTime);
                        actualActiveStyle.left = "0px";
                    }, 0);
                }
                else {
                    this.activePage.style.left = Config.getWindowWidth(true);
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    this.activePage.style.left = "0px";
                }
            }
            else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        }
        else {
            if (this.pages.indexOf(page) != -1) {
            }
            else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        }
    }
}
class PageManagerComponent extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.style.position = "absolute";
        this.style.top = "0";
        this.style.left = "0";
    }
}
var Effects;
(function (Effects) {
    Effects[Effects["NONE"] = 0] = "NONE";
    Effects[Effects["SWIPE_TO_LEFT"] = 1] = "SWIPE_TO_LEFT";
    Effects[Effects["SWIPE_TO_RIGHT"] = 2] = "SWIPE_TO_RIGHT";
})(Effects || (Effects = {}));
var Pages;
(function (Pages) {
    Pages[Pages["UNKNOWN"] = 0] = "UNKNOWN";
    Pages[Pages["LOGIN"] = 1] = "LOGIN";
    Pages[Pages["REGISTER"] = 2] = "REGISTER";
    Pages[Pages["DASHBOARD"] = 3] = "DASHBOARD";
    Pages[Pages["DEVICES"] = 4] = "DEVICES";
    Pages[Pages["HOME"] = 5] = "HOME";
})(Pages || (Pages = {}));
class AutoHomeRouter {
    constructor() {
    }
    getRoute() {
        let pathArr = window.location.pathname.split("/").slice(1).map((part) => { return part.toLocaleLowerCase(); });
        let entirePath = window.location.pathname.toLocaleLowerCase();
        let logged = localStorage.getItem("logged");
        this.route = { page: AutoHomeRouter.DEFAULT_LOGGED_PAGE, path: entirePath };
        let topLevel = pathArr[0];
        if (topLevel == "user") {
            switch (pathArr[1]) {
                case "login":
                    this.route.page = Pages.LOGIN;
                    break;
                case "register":
                    this.route.page = Pages.REGISTER;
                    break;
                default:
                    this.route.path = Paths.HOME;
                    new BaseError("Page " + entirePath + " not defined!", this);
                    break;
            }
        }
        else if (topLevel == "home") {
            this.route.page = Pages.HOME;
        }
        else if (topLevel == "dashboard") {
            this.route.page = Pages.DASHBOARD;
        }
        if (!logged) {
            this.route.afterLoginPage = this.route.page;
            this.route.page = Pages.LOGIN;
            this.route.afterLoginPath = this.route.path;
            this.route.path = Paths.LOGIN;
        }
        return this.route;
    }
    isLoginPath() {
        return window.location.pathname.toLocaleLowerCase() == "/user/login";
    }
}
AutoHomeRouter.DEFAULT_LOGGED_PAGE = Pages.HOME;
var Paths;
(function (Paths) {
    Paths["LOGIN"] = "user/login";
    Paths["REGISTER"] = "user/register";
    Paths["DASHBOARD"] = "dashboard";
    Paths["HOME"] = "home";
})(Paths || (Paths = {}));
class URLManager extends Singleton {
    static registerURLChangeListener(callback) {
        let urlManager = URLManager.getInstance();
        urlManager.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    static setURL(newURL, title = "", skipCallback = false) {
        let urlManager = URLManager.getInstance();
        window.history.pushState("", title, newURL);
        if (!skipCallback) {
            urlManager.onURLChange();
        }
    }
}
