import { Config } from "../../app/config.js";
import { AbstractComponent, IComponentProperties } from "../component.js";

export class BaseDialog extends AbstractComponent {
    overlayContainer: HTMLDivElement;
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
        this.classList.add("dialog-wrapper");

        
        this.overlayContainer = document.createElement("div");
        this.overlayContainer.innerHTML=`
            <div class="overlay">
            </div>
        `;
        let overlay = <HTMLElement>this.overlayContainer.querySelector(".overlay");
        overlay.style.width = <string>Config.getWindowWidth(true);
        overlay.style.height = <string>Config.getWindowHeight(true);
    }
}

export enum DialogResponses{
    OK,
    CANCEL,
    YES,
    NO
}