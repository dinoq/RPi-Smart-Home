import { Config } from "../../app/config.js";
import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        this.innerHTML = `
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
        let overlay = this.querySelector(".overlay");
        overlay.style.width = Config.getWindowWidth(true);
        overlay.style.height = Config.getWindowHeight(true);
        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', () => {
            this.remove();
        });
    }
}
ErrorDialog.tagName = "error-dialog";
