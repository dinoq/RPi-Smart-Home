"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLManager = void 0;
const singleton_js_1 = require("./singleton.js");
class URLManager extends singleton_js_1.Singleton {
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
    static reload() {
        let urlManager = URLManager.getInstance();
        urlManager.onURLChange();
    }
}
exports.URLManager = URLManager;
