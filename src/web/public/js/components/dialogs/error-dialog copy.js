import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        let errorDiv = document.createElement("div");
        errorDiv.innerHTML = `        
            <div class="error-dialog">
                ${error} 
                <div class="close-btn">
                    <div class="btn btn-danger">
                        close
                    </div>
                </div>
            </div>
        `;
        this.appendChild(this.overlayContainer);
        this.appendChild(errorDiv);
        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', () => {
            this.remove();
        });
    }
}
ErrorDialog.tagName = "error-dialog";
