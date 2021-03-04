import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { FrameListTypes } from "./frame-list.js";
export class FrameDetail extends AbstractComponent {
    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
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
        let elementsToCreate;
        if (type == this.actualFrameListType) { //Layout already created
        }
        else { // Create right layout
            this.actualFrameListType = type;
            if (type == FrameListTypes.ROOMS) {
                elementsToCreate = [
                    ["device-name", "Název místnosti", INPUT_TYPES.TEXT_FIELD],
                    ["bg-img-src", "URL obrázku na pozadí", INPUT_TYPES.TEXT_FIELD],
                    ["slider-for-image", "Posun obrázku", INPUT_TYPES.SLIDER_FOR_IMG_PREV],
                    ["img-preview", "Náhled obrázku", INPUT_TYPES.IMG_PREVIEW]
                ];
            }
            else if (type == FrameListTypes.MODULES) {
                elementsToCreate = [
                    ["device-name", "Název modulu", INPUT_TYPES.TEXT_FIELD],
                    ["module-id", "ID modulu", INPUT_TYPES.DISABLED_TEXT_FIELD],
                    ["module-type", "Typ modulu", INPUT_TYPES.DISABLED_TEXT_FIELD]
                ];
            }
            else if (type == FrameListTypes.SENSORS) {
                elementsToCreate = [
                    ["device-name", "Název snímače", INPUT_TYPES.TEXT_FIELD],
                    ["sensor-type", "Typ snímače", INPUT_TYPES.SELECT_SENSOR_TYPE],
                    ["pin", "Vstup", INPUT_TYPES.SELECT_SENSOR_INPUT],
                    ["unit", "Jednotky", INPUT_TYPES.TEXT_FIELD]
                ];
            }
            else if (type == FrameListTypes.DEVICES) {
                elementsToCreate = [
                    ["device-name", "Název zařízení", INPUT_TYPES.TEXT_FIELD],
                    ["output-type", "Typ výstupu", INPUT_TYPES.SELECT_OUTPUT_TYPE],
                    ["icon-type", "Ikona", INPUT_TYPES.SELECT_ICON_TYPE],
                    ["pin", "Výstup", INPUT_TYPES.SELECT_DEVICE_OUTPUT]
                ];
            }
            this.rows.innerHTML = "";
            elementsToCreate.forEach((elementInfo, index) => {
                let row = new FrameDetailRow(elementInfo[0], elementInfo[1], elementInfo[2]);
                AbstractComponent.appendComponentsToDOMElements(this.rows, row);
            });
        }
        Array.from(this.rows.children).forEach((row, index) => {
            let val = ((typeof values[index] == "string")) ? values[index] : (values[index])?.toString();
            row.initialize(val, onInputCallback);
        });
    }
    blink(count = 3) {
        Array.from(this.rows.children).forEach((row, index) => {
            let element = row.querySelector(".input-field").children[0];
            let className = (count == 1) ? "blink-once" : "blinking";
            element?.classList.add(className);
        });
        setTimeout(() => {
            Array.from(this.rows.children).forEach((row, index) => {
                let element = row.querySelector(".input-field").children[0];
                let className = (count == 1) ? "blink-once" : "blinking";
                element?.classList.remove(className);
            });
        }, count * 1000);
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
        else if (type == INPUT_TYPES.SELECT_OUTPUT_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="digital">Digitální (ON/OFF)</option>
                    <option value="analog">Analogový (Plynulý)</option>
                </select>
            `;
        }
        else if (type == INPUT_TYPES.SELECT_ICON_TYPE) { // Depends on output type
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;
            let outputType = document.getElementById("output-type");
            let options = [
                ["light", "Světlo", "switch", "Spínač", "motor", "Motor"],
                ["light", "Stmívatelné světlo", "motor", "Servo motor"] //analog
            ];
            let outputTypeChangedHandler = () => {
                let optionsArrayIndex = (outputType.value == "digital") ? 0 : 1;
                console.log('optionsArrayIndex: ', optionsArrayIndex);
                let selectElem = this.querySelector("select");
                selectElem.innerHTML = ""; // Clear options
                for (let i = 0; i < options[optionsArrayIndex].length; i += 2) {
                    let option = document.createElement("option");
                    option.value = options[optionsArrayIndex][i];
                    option.innerText = options[optionsArrayIndex][i + 1];
                    selectElem.appendChild(option);
                }
            };
            outputType.addEventListener("input", outputTypeChangedHandler);
            outputType.addEventListener("change", outputTypeChangedHandler);
            outputTypeChangedHandler();
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
                <div id="${id}">
                    <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${id}-input">
                </div>
            `;
        }
        else if (type == INPUT_TYPES.IMG_PREVIEW) {
            AbstractComponent.appendComponentsToDOMElements(input, new SlidableImg("slider-for-image-input", "bg-img-src"));
        }
        this.type = type;
        this.inputID = id;
        this.input = this.querySelector("#" + id);
    }
    initialize(val, onInputCallback) {
        if (Utils.itemIsAnyFromEnum(this.type, INPUT_TYPES, ["IMG_PREVIEW"])) { // Don't set value directly!
        }
        else {
            let element = this.input;
            if (this.type == INPUT_TYPES.SLIDER_FOR_IMG_PREV)
                element = this.input.querySelector("input");
            element.value = val;
            element.dispatchEvent(new Event('change')); // We must dispatch event programmatically to get new value immediately
            element.addEventListener("input", onInputCallback);
            if (element.value != val) {
                new UnknownValueInDatabaseError(val, this.type);
            }
        }
    }
}
FrameDetailRow.tagName = "frame-detail-row";
export class SlidableImg extends AbstractComponent {
    constructor(sliderID, imgSourceID, layoutProps) {
        super(layoutProps);
        this._sliderID = sliderID;
        this._imgSourceID = imgSourceID;
        let srcImgChangedHandler = () => {
            this.bgURL = this.imgSource.value;
            this.connectedCallback();
        };
        this.imgSource.addEventListener("input", srcImgChangedHandler);
        this.imgSource.addEventListener("change", srcImgChangedHandler);
        this.bgURL = this.imgSource.value;
        this.offset = Number.parseInt(this.slider.value);
        let sliderValueChangedHandler = () => {
            this.offset = Number.parseFloat(this.slider.value);
            this.connectedCallback();
        };
        this.slider.addEventListener("change", sliderValueChangedHandler);
        this.slider.addEventListener("input", sliderValueChangedHandler);
    }
    get slider() {
        return document.getElementById(this._sliderID);
    }
    get imgSource() {
        return document.getElementById(this._imgSourceID);
    }
    connectedCallback() {
        this.viewHeight = 162; //this.clientWidth / 5; //162px is standart height when one row is displayed and room name is not wrapped (because od css padding, icons height etc...)
        this.style.height = this.viewHeight + "px";
        this.parent.parentElement.querySelector("label").style.top = "-30px";
        let newBG = `url("${this.bgURL}")`;
        if (newBG != this.style.backgroundImage) {
            this.style.background = newBG;
            this.style.backgroundSize = "cover";
        }
        this.setBgImgOffsetY();
    }
    setBgImgOffsetY() {
        let img = new Image();
        img.addEventListener("load", () => {
            let newHeight = (this.clientWidth / img.naturalWidth) * img.naturalHeight - this.viewHeight;
            let newPosY = Math.round(-(newHeight * this.offset)) + "px";
            if (newPosY != this.style.backgroundPositionY)
                this.style.backgroundPositionY = newPosY;
        });
        img.src = this.bgURL;
    }
}
SlidableImg.tagName = "slidable-img";
export var INPUT_TYPES;
(function (INPUT_TYPES) {
    INPUT_TYPES[INPUT_TYPES["DISABLED_TEXT_FIELD"] = 0] = "DISABLED_TEXT_FIELD";
    INPUT_TYPES[INPUT_TYPES["TEXT_FIELD"] = 1] = "TEXT_FIELD";
    INPUT_TYPES[INPUT_TYPES["SELECT_SENSOR_TYPE"] = 2] = "SELECT_SENSOR_TYPE";
    INPUT_TYPES[INPUT_TYPES["SELECT_SENSOR_INPUT"] = 3] = "SELECT_SENSOR_INPUT";
    INPUT_TYPES[INPUT_TYPES["SELECT_OUTPUT_TYPE"] = 4] = "SELECT_OUTPUT_TYPE";
    INPUT_TYPES[INPUT_TYPES["SELECT_DEVICE_OUTPUT"] = 5] = "SELECT_DEVICE_OUTPUT";
    INPUT_TYPES[INPUT_TYPES["IMG_PREVIEW"] = 6] = "IMG_PREVIEW";
    INPUT_TYPES[INPUT_TYPES["SLIDER_FOR_IMG_PREV"] = 7] = "SLIDER_FOR_IMG_PREV";
    INPUT_TYPES[INPUT_TYPES["SELECT_ICON_TYPE"] = 8] = "SELECT_ICON_TYPE";
})(INPUT_TYPES || (INPUT_TYPES = {}));
