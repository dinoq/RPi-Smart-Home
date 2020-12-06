import { BaseDialog } from "./base-dialog.js";
export class ErrorDialog extends BaseDialog {
    constructor(error, componentProps) {
        super(componentProps);
        this.innerHTML = `
            ${error} 
            <div id="close-btn">
                <div class="btn btn-danger">
                    close
                </div>
            </div>
        `;
        document.body.appendChild(this);
        document.getElementById("close-btn").onclick = () => {
            this.remove();
        };
    }
}
