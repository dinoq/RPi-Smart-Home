import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(errorMsg, componentProps) {
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
        this.querySelector(".btn").addEventListener('click', () => {
            this.remove();
        });
    }
}
ErrorDialog.tagName = "error-dialog";
export class SingletonErrorDialog {
    constructor(errorMsg, componentProps) {
        let allDialogs = document.querySelectorAll(ErrorDialog.tagName);
        let exists = Array.from(allDialogs).some((dialog, index, array) => {
            return dialog.querySelector(".error-message").innerText.includes(errorMsg);
        });
        if (!exists) {
            new ErrorDialog(errorMsg);
        }
    }
}
export class ServerCommunicationErrorDialog {
    constructor(componentProps) {
        new SingletonErrorDialog("Při komunikaci se serverem došlo k chybě, zkontrolujte, zda server běží.");
    }
}
