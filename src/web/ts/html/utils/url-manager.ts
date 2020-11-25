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

    public registerURLChangeListener(callback): void{
        this.onURLChange = callback;
        window.addEventListener('popstate', callback);
    }
    public setURL(newURL: string, title: string=""): void{
        console.log('setURL: ');
        window.history.pushState("", title, newURL);
        this.onURLChange();
    }
}