import { Utils } from "../app/utils.js";
import { AbstractComponent, IComponentProperties } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { ARROWABLE_LISTS, FrameList, FrameListItem, FrameListTypes } from "./frame-list.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";

export class FrameDetail extends AbstractComponent {
    static tagName = "frame-detail";

    rows: any;
    actualFrameListType: FrameListTypes;

    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
        }));
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

    updateTitle(title: string) {
        (<HTMLDivElement>this.querySelector(".editing-name")).innerText = title;
    }

    updateDetail(title: string, type: FrameListTypes, onInputCallback, values) {
        this.updateTitle(title);

        let elementsToCreate: Array<any>;
        if (type == this.actualFrameListType) { //Layout already created

        } else {// Create right layout
            this.actualFrameListType = type;
            if (type == FrameListTypes.ROOMS) {
                elementsToCreate = [
                    ["device-name", "Název místnosti", INPUT_TYPES.TEXT_FIELD],
                    ["bg-img-src", "URL obrázku na pozadí", INPUT_TYPES.TEXT_FIELD],
                    ["slider-for-image", "Posun obrázku", INPUT_TYPES.SLIDER_FOR_IMG_PREV],
                    ["img-preview", "Náhled obrázku", INPUT_TYPES.IMG_PREVIEW]
                ];
            } else if (type == FrameListTypes.MODULES) {
                elementsToCreate = [
                    ["device-name", "Název modulu", INPUT_TYPES.TEXT_FIELD],
                    ["module-id", "ID modulu", INPUT_TYPES.DISABLED_TEXT_FIELD],
                    ["module-type", "Typ modulu", INPUT_TYPES.DISABLED_TEXT_FIELD]
                ];
            } else if (type == FrameListTypes.SENSORS) {
                elementsToCreate = [
                    ["device-name", "Název snímače", INPUT_TYPES.TEXT_FIELD],
                    ["sensor-type", "Typ snímače", INPUT_TYPES.SELECT_SENSOR_TYPE],
                    ["pin", "Vstup", INPUT_TYPES.SELECT_SENSOR_INPUT],
                    ["unit", "Jednotky", INPUT_TYPES.TEXT_FIELD]
                ];
            } else if (type == FrameListTypes.DEVICES) {
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
            (<FrameDetailRow>row).initialize(val, onInputCallback);
        });
    }

    blink(count: number = 3) {
        Array.from(this.rows.children).forEach((row: HTMLElement, index) => {
            let element: HTMLElement = (<HTMLElement>row.querySelector(".input-field").children[0]);
            let className = (count == 1) ? "blink-once" : "blinking";
            element?.classList.add(className);
        })

        setTimeout(() => {
            Array.from(this.rows.children).forEach((row: HTMLElement, index) => {
                let element: HTMLElement = (<HTMLElement>row.querySelector(".input-field").children[0]);
                let className = (count == 1) ? "blink-once" : "blinking";
                element?.classList.remove(className);
            })
        }, count * 1000);
    }

}

export class FrameDetailRow extends AbstractComponent {
    static tagName = "frame-detail-row";

    private layout: AbstractComponent;
    type: INPUT_TYPES;
    inputID: string;
    input: HTMLElement;
    constructor(id: string, name: string, type: INPUT_TYPES, layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
        }));


        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${name}</label>
                <div class="input-field">
                </div>
            </div>
        `;

        let input: HTMLElement = this.querySelector(".input-field");
        if (type == INPUT_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        } else if (type == INPUT_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        } else if (type == INPUT_TYPES.SELECT_SENSOR_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="temp">BME280</option>
                    <option value="switch">Kontakt</option>
                    <option value="threshold">Prahová hodnota</option>
                </select>
            `;
        } else if (type == INPUT_TYPES.SELECT_SENSOR_INPUT) {
            let selectedModule = <FrameListItem>document.querySelectorAll("frame-list")[1].querySelector(".active");
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
            } else if (moduleType == "ESP32") {

            }
        } else if (type == INPUT_TYPES.SELECT_OUTPUT_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="digital">Digitální (ON/OFF)</option>
                    <option value="analog">Analogový (Plynulý)</option>
                </select>
            `;
        } else if (type == INPUT_TYPES.SELECT_ICON_TYPE) { // Depends on output type
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let outputType = <HTMLInputElement>document.getElementById("output-type");
            
            let options = [
                ["light", "Světlo", "switch", "Spínač", "motor", "Motor"],  // digital
                ["light", "Stmívatelné světlo", "motor", "Servo motor"]  //analog
            ];
            let outputTypeChangedHandler = () => {
                let optionsArrayIndex = (outputType.value == "digital") ? 0 : 1;
                console.log('optionsArrayIndex: ', optionsArrayIndex);
                let selectElem = this.querySelector("select");
                selectElem.innerHTML = ""; // Clear options

                for (let i = 0; i < options[optionsArrayIndex].length; i += 2) {
                    let option = document.createElement("option");
                    option.value = options[optionsArrayIndex][i];
                    option.innerText = options[optionsArrayIndex][i+1];
                    selectElem.appendChild(option);
                }

            }
            outputType.addEventListener("input", outputTypeChangedHandler);
            outputType.addEventListener("change", outputTypeChangedHandler);
            outputTypeChangedHandler();
        } else if (type == INPUT_TYPES.SELECT_DEVICE_OUTPUT) {
            let selectedModule = <FrameListItem>document.querySelectorAll("frame-list")[1].querySelector(".active");
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
            } else if (moduleType == "ESP32") {

            }
        } else if (type == INPUT_TYPES.SLIDER_FOR_IMG_PREV) {
            input.innerHTML = `      
                <div id="${id}">
                    <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${id}-input">
                </div>
            `;
        } else if (type == INPUT_TYPES.IMG_PREVIEW) {
            AbstractComponent.appendComponentsToDOMElements(input, new SlidableImg("slider-for-image-input", "bg-img-src"));
        }
        this.type = type;
        this.inputID = id;
        this.input = this.querySelector("#" + id);
    }

    initialize(val: string, onInputCallback) {
        if (Utils.itemIsAnyFromEnum(this.type, INPUT_TYPES, ["IMG_PREVIEW"])) { // Don't set value directly!

        } else {
            let element = this.input;
            if (this.type == INPUT_TYPES.SLIDER_FOR_IMG_PREV)
                element = this.input.querySelector("input");

            (<HTMLInputElement>element).value = val;
            element.dispatchEvent(new Event('change')); // We must dispatch event programmatically to get new value immediately
            element.addEventListener("input", onInputCallback);
            if ((<HTMLInputElement>element).value != val) {
                new UnknownValueInDatabaseError(val, this.type);
            }
        }

    }

}

export class SlidableImg extends AbstractComponent {
    static tagName = "slidable-img";

    private offset: number;
    private bgURL: string;
    viewHeight: number;
    private _sliderID: string;
    private _imgSourceID: string;

    get slider(): HTMLInputElement {
        return <HTMLInputElement>document.getElementById(this._sliderID);
    }
    get imgSource(): HTMLInputElement {
        return <HTMLInputElement>document.getElementById(this._imgSourceID);
    }
    constructor(sliderID: string, imgSourceID: string, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this._sliderID = sliderID;
        this._imgSourceID = imgSourceID;

        let srcImgChangedHandler = () => {
            this.bgURL = this.imgSource.value;
            this.connectedCallback();
        }
        this.imgSource.addEventListener("input", srcImgChangedHandler);
        this.imgSource.addEventListener("change", srcImgChangedHandler);
        this.bgURL = this.imgSource.value;


        this.offset = Number.parseInt(this.slider.value);

        let sliderValueChangedHandler = () => {
            this.offset = Number.parseFloat(this.slider.value);
            this.connectedCallback();
        }
        this.slider.addEventListener("change", sliderValueChangedHandler);
        this.slider.addEventListener("input", sliderValueChangedHandler);
    }
    connectedCallback(): void {
        this.viewHeight = 162;//this.clientWidth / 5; //162px is standart height when one row is displayed and room name is not wrapped (because od css padding, icons height etc...)
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


export enum INPUT_TYPES {
    DISABLED_TEXT_FIELD,
    TEXT_FIELD,
    SELECT_SENSOR_TYPE,
    SELECT_SENSOR_INPUT,
    SELECT_OUTPUT_TYPE,
    SELECT_DEVICE_OUTPUT,
    IMG_PREVIEW,
    SLIDER_FOR_IMG_PREV,
    SELECT_ICON_TYPE
}
