import { BaseDialog, DialogResponses } from "./base-dialog.js";
export class YesNoCancelDialog extends BaseDialog {
    constructor(text, componentProps) {
        super(componentProps);
        let content = document.createElement("div");
        content.innerHTML = `        
            <div class="dialog">
                <div class="message-box">
                    ${text} 
                </div>
                <div class="dialog-btn-group">
                    <div class="btn btn-primary">
                        Ano
                    </div>
                    <div class="btn btn-secondary">
                        Ne
                    </div>
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
            this.querySelectorAll(".btn")[0].addEventListener('click', () => {
                resolve(DialogResponses.YES);
                this.remove();
            });
            this.querySelectorAll(".btn")[1].addEventListener('click', () => {
                resolve(DialogResponses.NO);
                this.remove();
            });
            this.querySelectorAll(".btn")[2].addEventListener('click', () => {
                resolve(DialogResponses.CANCEL);
                this.remove();
            });
        });
    }
}
YesNoCancelDialog.tagName = "yes-no-cancel-dialog";
