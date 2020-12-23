import { Config } from "../../app/config.js";
import { IComponentProperties } from "../component.js";
import { BaseDialog } from "./base-dialog.js";

export class ErrorDialog extends BaseDialog {
    static tagName = "error-dialog";
    
    constructor(error: string, componentProps?: IComponentProperties){
        super(componentProps);
        this.innerHTML=`
            <div class="overlay">
            </div>
            <div class="error-dialog">
                ${error} 
                <div class="close-btn">
                    <div class="btn btn-danger">
                        close
                    </div>
                </div>
            </div>
        `;
        let overlay = <HTMLElement>this.querySelector(".overlay");
        overlay.style.width = <string>Config.getWindowWidth(true);
        overlay.style.height = <string>Config.getWindowHeight(true);

        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', ()=>{            
            this.remove();
        })
    }
}
