import { BaseDialog, DialogResponses } from "./base-dialog.js";
export class CancelDialog extends BaseDialog {
    constructor(text, componentProps) {
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
    async show() {
        document.body.appendChild(this);
        this.overlayContainer.querySelector(".overlay").classList.add("light");
        return new Promise((resolve, reject) => {
            this.querySelector(".btn").addEventListener('click', () => {
                resolve(DialogResponses.CANCEL);
                this.remove();
            });
        });
    }
}
CancelDialog.tagName = "cancel-dialog";
