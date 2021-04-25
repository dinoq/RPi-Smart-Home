"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerAgainOnlineDialog = exports.ServerCommunicationErrorDialog = exports.SingletonErrorDialog = exports.ErrorDialog = void 0;
const base_dialog_js_1 = require("./base-dialog.js");
class ErrorDialog extends base_dialog_js_1.BaseDialog {
    constructor(errorMsg, componentProps) {
        super(componentProps);
        let errorDiv = document.createElement("div");
        errorDiv.innerHTML = `        
            <div class="dialog">
                <div class="message-box error-message text-danger">
                    ${errorMsg} 
                </div>
                <div class="dialog-btn-group">
                    <div class="btn btn-danger close-btn">
                        Zavřít
                    </div>
                </div>
            </div>
        `;
        this.appendChild(this.overlayContainer);
        this.appendChild(errorDiv);
        document.body.appendChild(this);
        this.querySelector(".close-btn").addEventListener('click', () => {
            this.remove();
        });
    }
}
exports.ErrorDialog = ErrorDialog;
ErrorDialog.tagName = "error-dialog";
class SingletonErrorDialog {
    constructor(errorMsg, componentProps) {
        let allDialogs = document.querySelectorAll(ErrorDialog.tagName);
        let exists = Array.from(allDialogs).some((dialog, index, array) => {
            return dialog.querySelector(".error-message").innerText.includes(errorMsg);
        });
        if (!exists) {
            this.dialog = new ErrorDialog(errorMsg);
        }
    }
}
exports.SingletonErrorDialog = SingletonErrorDialog;
class ServerCommunicationErrorDialog {
    constructor(componentProps) {
        let dialog = new SingletonErrorDialog("Při komunikaci se serverem došlo k chybě, zkontrolujte, zda server běží.<br>Pokud server běží, zkuste aktualizovat stránku.").dialog;
        let btnWrapper = dialog.querySelector(".dialog-btn-group");
        let refreshBtn = document.createElement("div");
        refreshBtn.classList.add("btn");
        refreshBtn.classList.add("btn-secondary");
        refreshBtn.classList.add("refresh-btn");
        refreshBtn.innerText = "Aktualizovat";
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
        btnWrapper.prepend(refreshBtn);
        let interval = setInterval(() => {
            fetch("alive", {
                method: 'POST',
                headers: { "Content-Type": "application/json" }
            }).then((resp) => {
                if (resp) {
                    if (dialog)
                        dialog.remove();
                    new ServerAgainOnlineDialog();
                    clearInterval(interval);
                    interval = undefined;
                }
            }).catch((err) => {
            });
        }, 5000);
    }
}
exports.ServerCommunicationErrorDialog = ServerCommunicationErrorDialog;
class ServerAgainOnlineDialog {
    constructor(componentProps) {
        let dialog = new SingletonErrorDialog("Server opět online!<br>Pro správnou funkci webového klienta doporučujeme aktualizovat stránku.").dialog;
        let btnWrapper = dialog.querySelector(".dialog-btn-group");
        let refreshBtn = document.createElement("div");
        refreshBtn.classList.add("btn");
        refreshBtn.classList.add("btn-secondary");
        refreshBtn.classList.add("refresh-btn");
        refreshBtn.innerText = "Aktualizovat";
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
        btnWrapper.prepend(refreshBtn);
        let msgBox = dialog.querySelector(".message-box");
        msgBox.classList.remove("text-danger");
        msgBox.style.color = "#00a62e";
        let closeBtn = dialog.querySelector(".btn-danger");
        closeBtn.classList.remove("btn-danger");
        closeBtn.classList.add("btn-primary");
    }
}
exports.ServerAgainOnlineDialog = ServerAgainOnlineDialog;
