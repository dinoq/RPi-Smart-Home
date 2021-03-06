import { BoardsManager } from "../app/boards-manager.js";
import { EventManager } from "../app/event-manager.js";
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
    private saveBtnContainer: HorizontalStack;
    
    private _readyToSave: boolean = false;
    set readyToSave(val) {
        if (val) {
            this.saveBtnContainer.classList.add("blink");
            (<HTMLButtonElement>(<HorizontalStack>this.saveBtnContainer).children[0]).style.fontWeight = "bold";
            this.saveBtnContainer.children[0].removeAttribute("disabled");
        } else {
            this.saveBtnContainer.classList.remove("blink");
            (<HTMLButtonElement>(<HorizontalStack>this.saveBtnContainer).children[0]).style.fontWeight = "normal";
            this.saveBtnContainer.children[0].setAttribute("disabled", "true");
        }
        this._readyToSave = val;
        EventManager.blockedByUnsavedChanges = val;
    }
    get readyToSave() {
        return this._readyToSave;
    }

    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(saveCallback, layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
        }));
        this.initialize(saveCallback);
    }

    initialize(saveCallback) {
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
        
        this.saveBtnContainer = new HorizontalStack({
            innerHTML: `
            <button class="save-btn">Uložit</button>
            `,
            classList: "settings-btns-stack"
        });
        this.saveBtnContainer.querySelector(".save-btn").addEventListener("click", saveCallback);
        let form = <HTMLElement>this.querySelector("form");
        AbstractComponent.appendComponentsToDOMElements(form, [this.saveBtnContainer]);
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
                    ["device-name", "Název místnosti", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["bg-img-src", "URL obrázku na pozadí", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["slider-for-image", "Posun obrázku", DETAIL_FIELD_TYPES.SLIDER_FOR_IMG_PREV],
                    ["img-preview", "Náhled obrázku", DETAIL_FIELD_TYPES.IMG_PREVIEW]
                ];
            } else if (type == FrameListTypes.MODULES) {
                elementsToCreate = [
                    ["device-name", "Název modulu", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["module-id", "ID modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD],
                    ["module-type", "Typ modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD]
                ];
            } else if (type == FrameListTypes.SENSORS) {
                elementsToCreate = [
                    ["device-name", "Název snímače (nepovinné)", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["input-type", "Typ vstupu", DETAIL_FIELD_TYPES.SELECT_SENSOR_TYPE],
                    ["input", "Vstup", DETAIL_FIELD_TYPES.SELECT_SENSOR_INPUT],
                    ["unit", "Způsob zobrazení", DETAIL_FIELD_TYPES.SELECT_INPUT_UNIT],
                    ["icon-type", "Ikona", DETAIL_FIELD_TYPES.SELECT_INPUT_ICON_TYPE]
                ];
            } else if (type == FrameListTypes.DEVICES) {
                elementsToCreate = [
                    ["device-name", "Název zařízení", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["output-type", "Typ výstupu", DETAIL_FIELD_TYPES.SELECT_OUTPUT_TYPE],
                    ["output", "Výstup", DETAIL_FIELD_TYPES.SELECT_DEVICE_OUTPUT],
                    ["icon-type", "Ikona", DETAIL_FIELD_TYPES.SELECT_OUTPUT_ICON_TYPE]
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
    type: DETAIL_FIELD_TYPES;
    inputID: string;
    input: HTMLElement;
    constructor(id: string, name: string, type: DETAIL_FIELD_TYPES, layoutProps?: IComponentProperties) {
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
        if (type == DETAIL_FIELD_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        } else if (type == DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        } else if (type == DETAIL_FIELD_TYPES.SELECT_SENSOR_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                <option value="digital">Digitální pin</option>
                <option value="analog">Analogový pin</option>
                <option value="bus">Sběrnice</option>
                </select>
            `;
        } else if (type == DETAIL_FIELD_TYPES.SELECT_SENSOR_INPUT) {
            let selectedModule = <FrameListItem>document.querySelectorAll("frame-list")[1].querySelector(".active");
            let boardType = selectedModule.dbCopy.type;

            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let inputType = <HTMLInputElement>document.getElementById("input-type");

            let options = [
                BoardsManager.mapToArrayForSelect("digital", boardType),  // digital
                BoardsManager.mapToArrayForSelect("analog", boardType),  //analog
                BoardsManager.mapToArrayForSelect("bus", boardType)  //analog
            ];

            this.initOptionsFromADSelect(options, inputType);
        } else if (type == DETAIL_FIELD_TYPES.SELECT_INPUT_UNIT) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let inputType = <HTMLInputElement>document.getElementById("input-type");

            let options = [
                ["on-off0", "On / Off", "on-off1", "Zapnuto / Vypnuto", "on-off2", "Sepnuto / Rozepnuto", "on-off3", "Otevřeno / Zavřeno"],  // digital
                ["c", "°C", "percentages", "%", "number", "číslo 0-1023 (Bez jednotky)"],  //analog                
                ["c", "°C", "percentages", "%", "number", "číslo 0-1023 (Bez jednotky)"]  //bus
            ];

            this.initOptionsFromADSelect(options, inputType);
        } else if (type == DETAIL_FIELD_TYPES.SELECT_INPUT_ICON_TYPE) { // Depends on input type
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let inputType = <HTMLInputElement>document.getElementById("input-type");

            let options = [
                ["switch", "Spínač", "-", "Bez ikony"],  // Digital
                ["temp", "Teploměr", "-", "Bez ikony"],  // Analog
                ["temp", "Teploměr", "bme", "Teploměr BME", "-", "Bez ikony"]  // Bus
            ];

            this.initOptionsFromADSelect(options, inputType);
        } else if (type == DETAIL_FIELD_TYPES.SELECT_OUTPUT_TYPE) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                    <option value="digital">Digitální (ON/OFF)</option>
                    <option value="analog">Analogový (Plynulý)</option>
                </select>
            `;
        } else if (type == DETAIL_FIELD_TYPES.SELECT_DEVICE_OUTPUT) {
            let selectedModule = <FrameListItem>document.querySelectorAll("frame-list")[1].querySelector(".active");
            let boardType = selectedModule.dbCopy.type;

            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let options = BoardsManager.mapToArrayForSelect("digital", boardType); // this select doesn't depend on output type (digital/analog) because every GPIO can be used as digital and analog for ESP8266
            let selectElem = this.querySelector("select");

            for (let i = 0; i < options.length; i += 2) {
                let option = document.createElement("option");
                option.value = options[i];
                option.innerText = options[i + 1];
                selectElem.appendChild(option);
            }
        } else if (type == DETAIL_FIELD_TYPES.SELECT_OUTPUT_ICON_TYPE) { // Depends on output type
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;

            let outputType = <HTMLInputElement>document.getElementById("output-type");

            let options = [
                ["light", "Světlo", "switch", "Spínač", "motor", "Motor", "-", "Bez ikony"],  // digital
                ["dimmable-light", "Stmívatelné světlo", "servo-motor", "Servo motor", "-", "Bez ikony"]  //analog
            ];

            this.initOptionsFromADSelect(options, outputType);
        } else if (type == DETAIL_FIELD_TYPES.SLIDER_FOR_IMG_PREV) {
            input.innerHTML = `      
                <div id="${id}">
                    <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${id}-input">
                </div>
            `;
        } else if (type == DETAIL_FIELD_TYPES.IMG_PREVIEW) {
            AbstractComponent.appendComponentsToDOMElements(input, new SlidableImg("slider-for-image-input", "bg-img-src"));
        }
        this.type = type;
        this.inputID = id;
        this.input = this.querySelector("#" + id);
    }

    /**
     * Creates options from analog/digital select
     * options is array in format: ["optionValue1", "optionInnerText1", "optionValue2", "optionInnerText2", ...]
     */
    initOptionsFromADSelect(options, ADSelect) {
        let outputTypeChangedHandler = () => {
            let optionsArrayIndex = (ADSelect.value == "digital") ? 0 : (ADSelect.value == "analog") ? 1 : 2;
            let selectElem = this.querySelector("select");
            selectElem.innerHTML = ""; // Clear options

            for (let i = 0; i < options[optionsArrayIndex].length; i += 2) {
                let option = document.createElement("option");
                option.value = options[optionsArrayIndex][i];
                option.innerText = options[optionsArrayIndex][i + 1];
                selectElem.appendChild(option);
            }

        }
        ADSelect.addEventListener("input", outputTypeChangedHandler);
        ADSelect.addEventListener("change", outputTypeChangedHandler);
        outputTypeChangedHandler();
    }
    initialize(val: string, onInputCallback) {
        if (Utils.itemIsAnyFromEnum(this.type, DETAIL_FIELD_TYPES, ["IMG_PREVIEW"])) { // Don't set value directly!

        } else {
            let element = this.input;
            if (this.type == DETAIL_FIELD_TYPES.SLIDER_FOR_IMG_PREV)
                element = this.input.querySelector("input");

            (<HTMLInputElement>element).value = val;
            element.addEventListener("input", onInputCallback);
            if ((<HTMLInputElement>element).value != val) {
                if (element instanceof HTMLSelectElement)
                    element.selectedIndex = 0;
                else if (element instanceof HTMLInputElement)
                    element.value = "";

                new UnknownValueInDatabaseError(val, this.type);
                onInputCallback(); // Call callback to set readyToSave btn active...
            }
            element.dispatchEvent(new Event('change')); // We must dispatch event programmatically to get new value immediately
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








export enum DETAIL_FIELD_TYPES {
    DISABLED_TEXT_FIELD,
    TEXT_FIELD,
    SELECT_SENSOR_TYPE,
    SELECT_SENSOR_INPUT,
    SELECT_OUTPUT_TYPE,
    SELECT_DEVICE_OUTPUT,
    IMG_PREVIEW,
    SLIDER_FOR_IMG_PREV,
    SELECT_OUTPUT_ICON_TYPE,
    SELECT_INPUT_ICON_TYPE,
    SELECT_INPUT_UNIT
}
