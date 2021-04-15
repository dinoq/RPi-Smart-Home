import { Config } from "../../app/config.js";
import { Utils } from "../../app/utils.js";
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
        overlay.style.width = <string>Utils.getWindowWidth(true);
        overlay.style.height = <string>Utils.getWindowHeight(true);
    }

    protected changeText(text: string){
        let msgBox = this.querySelector(".message-box");
        if(msgBox){
            msgBox.innerHTML = text; // we are using innerHTML for case of HTML formated text...
        }
    }
}

export enum DialogResponses{
    OK,
    CANCEL,
    YES,
    NO
}