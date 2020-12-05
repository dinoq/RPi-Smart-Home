export class URLManager {
    constructor() {
    }
    static getManager() {
        if (this.instance == undefined) {
            this.instance = new URLManager();
        }
        return this.instance;
    }
    static registerURLChangeListener(callback) {
        let urlManager = URLManager.getManager();
        urlManager.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    static setURL(newURL, title = "", skipCallback = false) {
        let urlManager = URLManager.getManager();
        window.history.pushState("", title, newURL);
        if (!skipCallback) {
            urlManager.onURLChange();
        }
    }
}
