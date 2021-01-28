import { BaseDialog, DialogResponses } from "./base-dialog.js";
export class YesNoCancelDialog extends BaseDialog {
    constructor(text, componentProps) {
        super(componentProps);
        let content = document.createElement("div");
        content.innerHTML = `        
            <div class="content">
                ${text} 
                <div class="close-btn">
                    <div class="btn btn-danger">
                        Ano
                    </div>
                    <div class="btn btn-danger">
                        Ne
                    </div>
                    <div class="btn btn-danger">
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
YesNoCancelDialog.tagName = "ok-cancel-dialog";
