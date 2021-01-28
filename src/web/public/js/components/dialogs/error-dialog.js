import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        let errorDiv = document.createElement("div");
        errorDiv.innerHTML = `        
            <div class="dialog">
                <div class="message-box error-message text-danger">
                    ${error} 
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
        this.querySelector(".btn").addEventListener('click', () => {
            this.remove();
        });
    }
}
ErrorDialog.tagName = "error-dialog";
