export class URLManager {
    constructor() {
    }
    static getManager() {
        if (this.instance == undefined) {
            this.instance = new URLManager();
        }
        return this.instance;
    }
    registerURLChangeListener(callback) {
        this.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    setURL(newURL, title = "") {
        console.log('setURL: ');
        window.history.pushState("", title, newURL);
        this.onURLChange();
    }
}
