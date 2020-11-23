

export declare var firebase:any;
export interface IPageElement{ 
    getElement() : HTMLDivElement;

}

export class PageElement implements IPageElement{
    protected element: HTMLDivElement;
    protected firebase:any = firebase;

    constructor(){
        this.element = document.createElement("div");
    }

    getElement() : HTMLDivElement{
        return this.element;
    }
}