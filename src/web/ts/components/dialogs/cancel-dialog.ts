import { Config } from "../../app/config.js";
import { IComponentProperties } from "../component.js";
import { BaseDialog, DialogResponses } from "./base-dialog.js";

export class CancelDialog extends BaseDialog {
    static tagName = "cancel-dialog";
    
    constructor(text: string, componentProps?: IComponentProperties){
        super(componentProps);

        let content = document.createElement("div");
        content.innerHTML = `        
            <div class="dialog">
                <div class="message-box">
                    ${text} 
                </div>
                <div class="dialog-btn-group">
                    <div class="btn btn-light">
                        Zrušit
                    </div>
                </div>
            </div>
        `;
        this.appendChild(this.overlayContainer);
        this.appendChild(content);

    }

    async show(){
        document.body.appendChild(this);
        (<HTMLElement>this.overlayContainer.querySelector(".overlay")).classList.add("light");

        return new Promise( (resolve,reject) => {
            this.querySelector(".btn").addEventListener('click', ()=>{       
                resolve(DialogResponses.CANCEL);   
                this.remove();                
            })
        });
    }
}

