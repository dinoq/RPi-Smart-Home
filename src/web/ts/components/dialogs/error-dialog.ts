import { componentProperties } from "../component.js";
import { BaseDialog } from "./base-dialog.js";

export class ErrorDialog extends BaseDialog {
    static tagName = "error-dialog";
    
    constructor(error: string, componentProps?: componentProperties){
        super(componentProps);
        this.innerHTML=`
            ${error} 
            <div class="close-btn">
                <div class="btn btn-danger">
                    close
                </div>
            </div>
        `;
        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', ()=>{            
            this.remove();
        })
    }
}
