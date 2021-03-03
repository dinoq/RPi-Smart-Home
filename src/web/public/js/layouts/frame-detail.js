import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { FrameListTypes } from "./frame-list.js";
export class FrameDetail extends AbstractComponent {
    constructor(layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this.blinkable = new Array(); // String array of blinkable elements (for query)
        this.initialize();
    }
    initialize() {
        this.innerHTML = `        
            <div class="form-wrapper">
                <form class="form" action="/dashboard" method="POST">
                    <div class="editing-name">Pro editaci klikněte na název místnosti/snímače/zařízení</div>
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
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název místnosti", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("bg-img-src", "URL obrázku na pozadí", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("slider-for-image", "Posun obrázku", INPUT_TYPES.SLIDER_FOR_IMG_PREV));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("img-preview", "Náhled obrázku", INPUT_TYPES.IMG_PREVIEW));
                this.blinkable = new Array("#device-name", "#bg-img-src", "#slider-for-image", "#img-preview");
            }
            else if (type == FrameListTypes.MODULES) {
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název modulu", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("module-id", "ID modulu", INPUT_TYPES.DISABLED_TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("module-type", "Typ modulu", INPUT_TYPES.DISABLED_TEXT_FIELD));
                this.blinkable = new Array("#device-name", "#module-id", "#module-type");
            }
            else if (type == FrameListTypes.SENSORS) {
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název snímače", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("sensor-type", "Typ snímače", INPUT_TYPES.SELECT_SENSOR_TYPE));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("pin", "Vstup", INPUT_TYPES.SELECT_SENSOR_INPUT));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("unit", "Jednotky", INPUT_TYPES.TEXT_FIELD));
                this.blinkable = new Array("#device-name", "#sensor-type", "#pin", "#unit");
            }
            else if (type == FrameListTypes.DEVICES) {
                this.rows.innerHTML = "";
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("device-name", "Název zařízení", INPUT_TYPES.TEXT_FIELD));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("icon-type", "Typ zařízení", INPUT_TYPES.SELECT_DEVICE_TYPE));
                AbstractComponent.appendComponentsToDOMElements(this.rows, new FrameDetailRow("pin", "Výstup", INPUT_TYPES.SELECT_DEVICE_OUTPUT));
                this.blinkable = new Array("#device-name", "#icon-type", "#pin");
            }
        }
        Array.from(this.rows.children).forEach((row, index) => {
            let val = (typeof values[index] == "string") ? values[index] : (values[index]).toString();
            row.initialize(val, onInputCallback);
        });
    }
    blink() {
        for (let i = 0; i < this.blinkable.length; i++) {
            let element = this.querySelector(this.blinkable[i]);
            element?.classList.add("blinking");
        }
        setTimeout(() => {
            for (let i = 0; i < this.blinkable.length; i++) {
                let element = this.querySelector(this.blinkable[i]);
                element?.classList.remove("blinking");
            }
        }, 3000);
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
                </div>
            </div>
        `;
        let input = this.querySelector(".input-field");
        if (type == INPUT_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        }
        else if (type == INPUT_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        }
        else if (type == INPUT_TYPES.SELECT_SENSOR_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="temp">BME280</option>
                    <option value="switch">Kontakt</option>
                    <option value="threshold">Prahová hodnota</option>
                </select>
            `;
        }
        else if (type == INPUT_TYPES.SELECT_SENSOR_INPUT) {
            let selectedModule = document.querySelectorAll("frame-list")[1].querySelector(".active");
            let moduleType = selectedModule.dbCopy.type;
            if (moduleType == "ESP8266") {
                input.innerHTML = `                            
                    <select id="${id}" name="${id}">
                        <option value="A0">A0</option>
                        <option value="D0">D0</option>
                        <option value="D1">D1</option>
                        <option value="D2">D2</option>
                        <option value="D3">D3</option>
                    </select>
                `;
            }
            else if (moduleType == "ESP32") {
            }
        }
        else if (type == INPUT_TYPES.SELECT_DEVICE_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="light-bulb">Žárovka</option>
                    <option value="switch">Spínač</option>
                    <option value="transistor">Tranzistor</option>
                    <option value="blinds">Žaluzie</option>
                </select>
            `;
        }
        else if (type == INPUT_TYPES.SELECT_DEVICE_OUTPUT) {
            let selectedModule = document.querySelectorAll("frame-list")[1].querySelector(".active");
            let moduleType = selectedModule.dbCopy.type;
            if (moduleType == "ESP8266") {
                input.innerHTML = `                            
                    <select id="${id}" name="${id}">
                        <option value="A0">A0</option>
                        <option value="D0">D0</option>
                        <option value="D1">D1</option>
                        <option value="D2">D2</option>
                        <option value="D3">D3</option>
                    </select>
                `;
            }
            else if (moduleType == "ESP32") {
            }
        }
        else if (type == INPUT_TYPES.SLIDER_FOR_IMG_PREV) {
            input.innerHTML = `
                <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${id}" name="${id}">
            `;
        }
        else if (type == INPUT_TYPES.IMG_PREVIEW) {
            let slider = document.getElementById("slider-for-image");
            AbstractComponent.appendComponentsToDOMElements(input, new SlidableImg(slider));
        }
        this.type = type;
        this.inputID = id;
        this.input = this.querySelector("#" + id);
    }
    initialize(val, onInputCallback) {
        if (Utils.itemIsAnyFromEnum(this.type, INPUT_TYPES, ["IMG_PREVIEW"])) { // Don't set value directly!
        }
        else {
            this.input.value = val;
            this.input.dispatchEvent(new Event('change')); // We must dispatch event programmatically to get new value immediately
            this.input.addEventListener("input", onInputCallback);
            if (this.input.value != val) {
                new UnknownValueInDatabaseError(val, this.type);
            }
        }
    }
}
FrameDetailRow.tagName = "frame-detail-row";
export class SlidableImg extends AbstractComponent {
    constructor(slider, layoutProps) {
        super(layoutProps);
        let srcImgChangedHandler = () => {
            this.bgURL = document.getElementById("bg-img-src").value;
            this.connectedCallback();
        };
        let imgSrcInput = document.getElementById("bg-img-src");
        imgSrcInput.addEventListener("input", srcImgChangedHandler);
        imgSrcInput.addEventListener("change", srcImgChangedHandler);
        this.bgURL = document.getElementById("bg-img-src").value;
        this.offset = Number.parseInt(slider.value);
        let sliderValueChangedHandler = () => {
            this.offset = Number.parseFloat(slider.value);
            this.connectedCallback();
        };
        slider.addEventListener("change", sliderValueChangedHandler);
        slider.addEventListener("input", sliderValueChangedHandler);
    }
    connectedCallback() {
        this.viewHeight = this.clientWidth / 5;
        this.style.height = this.viewHeight + "px";
        this.parent.parentElement.querySelector("label").style.top = "-30px";
        this.style.background = "url(" + this.bgURL + ")";
        this.style.backgroundSize = "cover";
        this.setBgImgOffsetY();
    }
    setBgImgOffsetY() {
        var img = new Image();
        img.addEventListener("load", () => {
            let newHeight = (this.clientWidth / img.naturalWidth) * img.naturalHeight - this.viewHeight;
            this.style.backgroundPositionY = -(newHeight * this.offset) + "px";
        });
        img.src = this.bgURL;
        console.log('this.bgURL: ', this.bgURL);
    }
}
SlidableImg.tagName = "slidable-img";
export var INPUT_TYPES;
(function (INPUT_TYPES) {
    INPUT_TYPES[INPUT_TYPES["DISABLED_TEXT_FIELD"] = 0] = "DISABLED_TEXT_FIELD";
    INPUT_TYPES[INPUT_TYPES["TEXT_FIELD"] = 1] = "TEXT_FIELD";
    INPUT_TYPES[INPUT_TYPES["SELECT_SENSOR_TYPE"] = 2] = "SELECT_SENSOR_TYPE";
    INPUT_TYPES[INPUT_TYPES["SELECT_SENSOR_INPUT"] = 3] = "SELECT_SENSOR_INPUT";
    INPUT_TYPES[INPUT_TYPES["SELECT_DEVICE_TYPE"] = 4] = "SELECT_DEVICE_TYPE";
    INPUT_TYPES[INPUT_TYPES["SELECT_DEVICE_OUTPUT"] = 5] = "SELECT_DEVICE_OUTPUT";
    INPUT_TYPES[INPUT_TYPES["IMG_PREVIEW"] = 6] = "IMG_PREVIEW";
    INPUT_TYPES[INPUT_TYPES["SLIDER_FOR_IMG_PREV"] = 7] = "SLIDER_FOR_IMG_PREV";
})(INPUT_TYPES || (INPUT_TYPES = {}));
