import { Config } from "../../app/config.js";
import { IComponentProperties } from "../component.js";
import { BaseDialog } from "./base-dialog.js";

export class ErrorDialog extends BaseDialog {
    static tagName = "error-dialog";
    
    constructor(errorMsg: string, componentProps?: IComponentProperties){
        super(componentProps);

        let errorDiv = document.createElement("div");
        errorDiv.innerHTML = `        
            <div class="dialog">
                <div class="message-box error-message text-danger">
                    ${errorMsg} 
                </div>
                <div class="dialog-btn-group">
                    <div class="btn btn-danger">
                        close
                    </div>
                </div>
            </div>
        `;
        this.appendChild(this.overlayContainer);
        this.appendChild(errorDiv);

        document.body.appendChild(this);
        this.querySelector(".btn").addEventListener('click', ()=>{            
            this.remove();
        })
    }
}

export class SingletonErrorDialog {
    
    constructor(errorMsg: string, componentProps?: IComponentProperties){
        let allDialogs = document.querySelectorAll(ErrorDialog.tagName);
        let exists = Array.from(allDialogs).some((dialog: HTMLElement, index, array) => {
            return (<HTMLElement>dialog.querySelector(".error-message")).innerText.includes(errorMsg);
        })

        if(!exists){
            new ErrorDialog(errorMsg);
        }
    }
}

export class ServerCommunicationErrorDialog {
    constructor(componentProps?: IComponentProperties){
        new SingletonErrorDialog("Při komunikaci se serverem došlo k chybě, zkontrolujte, zda server běží.");
    }
}
    