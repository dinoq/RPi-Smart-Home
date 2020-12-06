import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        this.innerHTML = `
            ${error} 
            <div class="close-btn">
                <div class="btn btn-danger">
                    close
                </div>
            </div>
        `;
        document.body.appendChild(this);
        this.getElementsByClassName("close-btn")[0].addEventListener('click', () => {
            this.remove();
        });
    }
}
