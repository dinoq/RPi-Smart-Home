import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
import { FrameListTypes } from "./frame-list.js";
export class FrameDetail extends AbstractComponent {
    constructor(layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this.innerHTML = `        
            <div id="form-wrapper">
                <form id="login-form" action="/dashboard" method="POST">
                    <div class="editing-name">Pro editaci klikněte na název místnosti/senzoru/zařízení</div>
                    <div class="detail-frame-rows" style="width: 100%;"></div>
                </form>
            </div>        
        `;
        this.rows = this.querySelector(".detail-frame-rows");
    }
    updateTitle(title) {
        this.querySelector(".editing-name").innerText = title;
    }
    updateDetail(title, type, onInputCallback, values) {
        this.updateTitle(title);
        if (type == this.actualFrameListType) { //Layout already created
        }
        else { // Create right layout
            this.actualFrameListType = type;
            if (type == FrameListTypes.ROOMS) {
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("room-name", "Název místnosti"));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("img-src", "URL obrázku na pozadí"));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("img-offset", "Posun obrázku"));
            }
        }
        Array.from(this.rows.children).forEach((row, index) => {
            row.initialize(values[index], onInputCallback);
        });
    }
}
FrameDetail.tagName = "frame-detail";
export class FrameDetailRow extends AbstractComponent {
    constructor(id, name, layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${name}</label>
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>
            </div>
        `;
    }
    initialize(val, onInputCallback) {
        let input = this.querySelector("input");
        input.value = val;
        input.addEventListener("input", onInputCallback);
    }
}
FrameDetailRow.tagName = "frame-detail-row";
