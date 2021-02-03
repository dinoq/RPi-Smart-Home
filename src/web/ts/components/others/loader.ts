import { Singleton } from "../../app/singleton.js";
import { AbstractComponent, Component } from "../component.js";

export class Loader extends Singleton{
    element:LoaderComponent;
    constructor(){
        super();
        this.element = new LoaderComponent();
    }
    public static getInstance(): Loader{
        return <Loader>super.getInstance();
    }

    static show(){
        AbstractComponent.appendComponentsToDOMElements(document.body, Loader.getInstance().element);
    }

    static hide(){
        try {
            document.body.removeChild(Loader.getInstance().element);            
        } catch (error) {            
        }
    }

}

export class LoaderComponent extends AbstractComponent{
    static tagName = "app-loader";

    constructor(){
        super();
        this.innerHTML = `
            <div class="spinner"></div>
            <div class="message-container">
                <div class="message">Vyčkejte, data se načítají z databáze...</div>
            </div>
        `;
    }

}

