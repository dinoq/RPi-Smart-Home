import { Singleton } from "../../app/singleton.js";
import { AbstractComponent } from "../component.js";
export class Loader extends Singleton {
    constructor() {
        super();
        this.element = new LoaderComponent();
    }
    static getInstance() {
        return super.getInstance();
    }
    static show() {
        AbstractComponent.appendComponentsToDOMElements(document.body, Loader.getInstance().element);
    }
    static hide() {
        document.body.removeChild(Loader.getInstance().element);
    }
}
export class LoaderComponent extends AbstractComponent {
    constructor() {
        super();
        this.innerHTML = `
            <div class="spinner"></div>
            <div class="message-container">
                <div class="message">Vyčkejte, data se načítají z databáze...</div>
            </div>
        `;
    }
}
LoaderComponent.tagName = "app-loader";
