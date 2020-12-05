export class URLManager{
    private onURLChange: Function;
    static instance: URLManager;

    constructor(){        
    }

    public static getManager(): URLManager{
    	if(this.instance == undefined){
			this.instance = new URLManager();
        }
    	return this.instance;
    }

    public static registerURLChangeListener(callback): void{
        let urlManager = URLManager.getManager();
        urlManager.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    public static setURL(newURL: string, title: string="", skipCallback: boolean=false): void{
        let urlManager = URLManager.getManager();
        window.history.pushState("", title, newURL);
        if(!skipCallback){
            urlManager.onURLChange();
        }
    }
}