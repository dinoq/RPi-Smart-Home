import { Singleton } from "./singleton.js";
export class URLManager extends Singleton {
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
