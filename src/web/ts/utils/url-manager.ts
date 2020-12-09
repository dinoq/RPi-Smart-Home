import { Singleton } from "./singleton.js";

export class URLManager extends Singleton{
    private onURLChange: Function;
    static instance: URLManager;

    public static registerURLChangeListener(callback): void{
        let urlManager = URLManager.getInstance();
        (<URLManager>urlManager).onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    public static setURL(newURL: string, title: string="", skipRendering: boolean=false): void{
        let urlManager = URLManager.getInstance();
        window.history.pushState("", title, newURL);
        if(!skipRendering){
            (<URLManager>urlManager).onURLChange();
        }
    }
}