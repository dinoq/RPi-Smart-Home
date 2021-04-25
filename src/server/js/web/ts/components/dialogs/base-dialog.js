"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogResponses = exports.BaseDialog = void 0;
const utils_js_1 = require("../../app/utils.js");
const component_js_1 = require("../component.js");
class BaseDialog extends component_js_1.AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
        this.classList.add("dialog-wrapper");
        this.overlayContainer = document.createElement("div");
        this.overlayContainer.innerHTML = `
            <div class="overlay">
            </div>
        `;
        let overlay = this.overlayContainer.querySelector(".overlay");
        overlay.style.width = utils_js_1.Utils.getWindowWidth(true);
        overlay.style.height = utils_js_1.Utils.getWindowHeight(true);
    }
    changeText(text) {
        let msgBox = this.querySelector(".message-box");
        if (msgBox) {
            msgBox.innerHTML = text; // we are using innerHTML for case of HTML formated text...
        }
    }
}
exports.BaseDialog = BaseDialog;
var DialogResponses;
(function (DialogResponses) {
    DialogResponses[DialogResponses["OK"] = 0] = "OK";
    DialogResponses[DialogResponses["CANCEL"] = 1] = "CANCEL";
    DialogResponses[DialogResponses["YES"] = 2] = "YES";
    DialogResponses[DialogResponses["NO"] = 3] = "NO";
})(DialogResponses = exports.DialogResponses || (exports.DialogResponses = {}));
