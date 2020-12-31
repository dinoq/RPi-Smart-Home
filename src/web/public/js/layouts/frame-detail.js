import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { FrameListTypes } from "./frame-list.js";
export class FrameDetail extends AbstractComponent {
    constructor(layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this.initialize();
    }
    initialize() {
        this.innerHTML = `        
            <div class="form-wrapper">
                <form class="form" action="/dashboard" method="POST">
                    <div class="editing-name">Pro editaci klikněte na název místnosti/senzoru/zařízení</div>
                    <div class="detail-frame-rows" style="width: 100%;"></div>
                </form>
            </div>        
        `;
        this.rows = this.querySelector(".detail-frame-rows");
        this.actualFrameListType = -1;
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
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("room-name", "Název místnosti", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("img-src", "URL obrázku na pozadí", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("img-offset", "Posun obrázku", INPUT_TYPES.TEXT_FIELD));
            }
            else if (type == FrameListTypes.SENSORS) {
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název zařízení", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("icon-type", "Typ ikony", INPUT_TYPES.SELECT_SENSORS));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("unit", "Jednotky", INPUT_TYPES.TEXT_FIELD));
            }
            else if (type == FrameListTypes.DEVICES) {
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název zařízení", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("icon-type", "Typ ikony", INPUT_TYPES.SELECT_DEVICES));
            }
        }
        Array.from(this.rows.children).forEach((row, index) => {
            let val = (typeof values[index] == "string") ? values[index] : (values[index]).toString();
            row.initialize(val, onInputCallback);
        });
    }
}
FrameDetail.tagName = "frame-detail";
export class FrameDetailRow extends AbstractComponent {
    constructor(id, name, type, layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${name}</label>
                <div class="input-field">
                    <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>
                </div>
            </div>
        `;
        let input = this.querySelector(".input-field");
        if (type == INPUT_TYPES.SELECT_SENSORS) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="temp">Teploměr</option>
                    <option value="humidity">Kapka</option>
                    <option value="switch">Spínač</option>
                </select>
            `;
        }
        else if (type == INPUT_TYPES.SELECT_DEVICES) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="light-bulb">Žárovka</option>
                    <option value="switch">Spínač</option>
                    <option value="transistor">Tranzistor</option>
                    <option value="blinds">Žaluzie</option>
                </select>
            `;
        }
        this.type = type;
        this.inputID = id;
        this.input = this.querySelector("#" + id);
    }
    initialize(val, onInputCallback) {
        this.input.value = val;
        this.input.addEventListener("input", onInputCallback);
        if (this.input.value != val) {
            new UnknownValueInDatabaseError(val, this.type);
        }
    }
}
FrameDetailRow.tagName = "frame-detail-row";
export var INPUT_TYPES;
(function (INPUT_TYPES) {
    INPUT_TYPES[INPUT_TYPES["TEXT_FIELD"] = 0] = "TEXT_FIELD";
    INPUT_TYPES[INPUT_TYPES["SELECT_SENSORS"] = 1] = "SELECT_SENSORS";
    INPUT_TYPES[INPUT_TYPES["SELECT_DEVICES"] = 2] = "SELECT_DEVICES";
})(INPUT_TYPES || (INPUT_TYPES = {}));
