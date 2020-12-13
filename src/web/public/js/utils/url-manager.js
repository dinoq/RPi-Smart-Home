import { Singleton } from "./singleton.js";
export class URLManager extends Singleton {
    static registerURLChangeListener(callback) {
        let urlManager = URLManager.getInstance();
        urlManager.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    static setURL(newURL, title = "", skipRendering = false) {
        let urlManager = URLManager.getInstance();
        window.history.pushState("", title, newURL);
        if (!skipRendering) {
            urlManager.onURLChange();
        }
    }
    static replaceURL(newURL, title = "", skipRendering = false) {
        let urlManager = URLManager.getInstance();
        window.history.replaceState("", title, newURL);
        if (!skipRendering) {
            urlManager.onURLChange();
        }
    }
}
