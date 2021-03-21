import { BaseDialog, DialogResponses } from "./base-dialog.js";
export class OneOptionDialog extends BaseDialog {
    constructor(text, optionType = DialogResponses.OK, optionText, componentProps) {
        super(componentProps);
        this.option = optionType;
        if (optionText) {
            this.optionText = optionText;
        }
        else {
            let optText = "OK";
            optText = (optionType == DialogResponses.OK) ? "OK" : optText;
            optText = (optionType == DialogResponses.CANCEL) ? "Zrušit" : optText;
            optText = (optionType == DialogResponses.YES) ? "Ano" : optText;
            optText = (optionType == DialogResponses.NO) ? "Ne" : optText;
            this.optionText = optText;
        }
        let content = document.createElement("div");
        content.innerHTML = `        
            <div class="dialog">
                <div class="message-box">
                    ${text} 
                </div>
                <div class="dialog-btn-group">
                    <div class="btn btn-primary">
                        ${this.optionText}
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
            this.resolveShow = resolve;
            this.rejectShow = reject;
            this.querySelector(".btn").addEventListener('click', () => {
                resolve(DialogResponses.CANCEL);
                this.remove();
            });
        });
    }
}
OneOptionDialog.tagName = "cancel-dialog";
