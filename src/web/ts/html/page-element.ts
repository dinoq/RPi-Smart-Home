

export declare var firebase:any;
export interface IPageElement{ 
    getElement() : HTMLDivElement;

}

export class PageComponent implements IPageElement{
    protected firebase:any = firebase;
    protected element: HTMLDivElement;

    constructor(){
        this.element = document.createElement("div");
    }

    getElement() : HTMLDivElement{
        return this.element;
    }
}