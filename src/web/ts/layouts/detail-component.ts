import { Board, BoardsManager } from "../app/boards-manager.js";
import { EventManager } from "../app/event-manager.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent, IComponentProperties } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { ARROWABLE_LISTS, List, ListItem, ListTypes } from "./list-component.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
import { BaseDialogError } from "../errors/base-error.js";

export abstract class BaseDetail extends AbstractComponent {
    static tagName = "detail-component";

    rows: any;
    actualFrameListType: ListTypes;
    private btnsContainer: HorizontalStack;
    private _saveBtn: HTMLButtonElement;
    private _cancelBtn: HTMLButtonElement;

    private _readyToSave: boolean = false;
    set readyToSave(val) {
        if (val) {
            this._saveBtn.classList.add("blink");
            this._saveBtn.style.fontWeight = "bold";
            this._saveBtn.removeAttribute("disabled");

            this._cancelBtn.style.fontWeight = "bold";
            this._cancelBtn.removeAttribute("disabled");
        } else {
            this._saveBtn.classList.remove("blink");
            this._saveBtn.style.fontWeight = "normal";
            this._saveBtn.setAttribute("disabled", "true");

            this._cancelBtn.style.fontWeight = "normal";
            this._cancelBtn.setAttribute("disabled", "true");
        }
        this._readyToSave = val;
        EventManager.blockedByUnsavedChanges = val;
    }
    get readyToSave() {
        return this._readyToSave;
    }

    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(saveCallback, cancelCallback, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.initialize(saveCallback, cancelCallback);
    }

    initialize(saveCallback, cancelCallback) {
        this.innerHTML = `        
            <div class="form-wrapper">
                <div class="form">
                    <div class="editing-name">Titulek detailu</div>
                    <div class="detail-rows" style="width: 100%;"></div>
                </div>
            </div>        
        `;
        this.rows = this.querySelector(".detail-rows");
        this.actualFrameListType = -1;

        this.btnsContainer = new HorizontalStack({
            innerHTML: `
            <button class="btn cancel-btn">Zrušit změny</button>
            <button class="btn save-btn">Uložit</button>
            `,
            classList: "settings-btns-stack"
        });
        this._cancelBtn = this.btnsContainer.querySelector(".cancel-btn");
        this._cancelBtn.addEventListener("click", () => {
            cancelCallback();
            this.readyToSave = false;
        });
        this._saveBtn = this.btnsContainer.querySelector(".save-btn");
        this._saveBtn.addEventListener("click", saveCallback);

        this.readyToSave = false;

        let form = <HTMLElement>this.querySelector(".form");
        AbstractComponent.appendComponentsToDOMElements(form, [this.btnsContainer]);
    }

    updateTitle(title: string) {
        (<HTMLDivElement>this.querySelector(".editing-name")).innerText = title;
    }

    updateDetail(title: string, type: ListTypes, values) {
        this.updateTitle(title);

        if (type != this.actualFrameListType) { //Layout already created
            this.updateDetailLayout(type);
        }

        Array.from(this.rows.children).forEach((row, index) => {
            (<DetailRow>row).initializeValues(values[index], (event) => { this.readyToSave = true });
        });
    }

    updateDetailLayout(type: ListTypes) {
        this.actualFrameListType = type;
        let elementsToCreate: Array<any> = this.getElementsToCreate(type);

        this.rows.innerHTML = "";
        elementsToCreate.forEach((elementInfo, index) => {
            let detailRowProps: IDetailRowProps = {
                id: elementInfo[0],
                name: elementInfo[1],
                type: elementInfo[2]
            }
            if (detailRowProps.type == DETAIL_FIELD_TYPES.SLIDABLE_IMG_PREVIEW) {
                detailRowProps.data = {
                    imgID: elementInfo[3],
                    imgSourceID: elementInfo[4]
                }
            }
            let row = new DetailRow(detailRowProps);
            AbstractComponent.appendComponentsToDOMElements(this.rows, row);
        });
    }

    abstract getElementsToCreate(type: ListTypes): any[];

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

export class DetailRow extends AbstractComponent {
    static tagName = "detail-row";

    private layout: AbstractComponent;
    type: DETAIL_FIELD_TYPES;
    inputID: string;
    input: HTMLElement;
    constructor(detailRowProps: IDetailRowProps, layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
        }));


        this.initializeRow(detailRowProps);
        /*  
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
              let selectedModule = <ListItem>document.querySelectorAll("list-component")[1].querySelector(".active");
              let boardType = selectedModule.dbCopy.type;            
              let i2cPins = (Board[boardType])? Board[boardType].i2cPins : undefined;
              let i2cOption = (i2cPins)? `<option value="bus">Sběrnice I2C (SCL = pin ${i2cPins.SCL}, SDA = pin ${i2cPins.SDA})</option>` : "";
              input.innerHTML = `                            
                  <select id="${id}" name="${id}">
                  <option value="digital">Digitální pin</option>
                  <option value="analog">Analogový pin</option>
                  ${i2cOption}
                  </select>
              `;
          } else if (type == DETAIL_FIELD_TYPES.SELECT_SENSOR_INPUT) {
              let selectedModule = <ListItem>document.querySelectorAll("list-component")[1].querySelector(".active");
              let boardType = selectedModule.dbCopy.type;
  
              input.innerHTML = `                            
                  <select id="${id}" name="${id}">
                  </select>
              `;
  
              let inputType = <HTMLInputElement>document.getElementById("input-type");            
  
              let options = [
                  BoardsManager.mapToArrayForSelect("digital", boardType),  // digital
                  BoardsManager.mapToArrayForSelect("analog", boardType),  //analog
                  BoardsManager.mapToArrayForSelect("bus", boardType)  
              ];
  
              this.initOptionsFromADSelect(options, inputType);
          } else if (type == DETAIL_FIELD_TYPES.SELECT_INPUT_UNIT) {
              input.innerHTML = `                            
                  <select id="${id}" name="${id}">
                  </select>
              `;
  
              let inputType = <HTMLInputElement>document.getElementById("input-type");
  
              let options = [
                  ["on-off0", "On / Off", "on-off1", "Zapnuto / Vypnuto", "on-off2", "Sepnuto / Rozepnuto", "on-off3", "Zavřeno / Otevřeno"],  // digital
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
                  ["temp", "Teploměr", "press", "Tlakoměr", "hum", "Vlhkost", "-", "Bez ikony"],  // Analog
                  ["temp", "Teploměr", "bmp-temp", "Senzor BMP (teplota)", "sht-temp", "Senzor SHT (teplota)", "press", "Tlakoměr", "hum", "Vlhkost", "-", "Bez ikony"]  // Bus
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
              let selectedModule = <ListItem>document.querySelectorAll("list-component")[1].querySelector(".active");
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
                  ["light", "Světlo", "switch", "Spínač", "motor", "Motor"],  // digital
                  ["dimmable-light", "Stmívatelné světlo"]  //analog
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
          this.input = this.querySelector("#" + id);*/
    }
    initializeRow(detailRowProps: IDetailRowProps) {
        let type = detailRowProps.type;
        let id = detailRowProps.id;
        let name = detailRowProps.name;
        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${name}</label>
                <div class="input-field">
                </div>
            </div>
        `;
        this.type = type;
        this.inputID = id;

        let input: HTMLElement = this.querySelector(".input-field");
        if (type == DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;
        } else if (type == DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        } else if (type == DETAIL_FIELD_TYPES.SELECTBOX) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;
        } else if (type == DETAIL_FIELD_TYPES.SLIDABLE_IMG_PREVIEW) {
            this.innerHTML = "";
            AbstractComponent.appendComponentsToDOMElements(this, new SlidableImg(id, detailRowProps.data.imgID, detailRowProps.data.imgSourceID));
        } else if (type == DETAIL_FIELD_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        } else {
            new BaseDialogError("Neznámá chyba při inicializaci detailu!", this);
        }


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

    initializeValues(initObject: IDetailRowInitObject, onInputCallback) {
        if (this.type == DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX) {
            if (!("dependsOnProps" in initObject)) {
                new BaseDialogError("Chyba při inicializaci detailu!", this, true);
                return;
            }
            let allOptions = [];
            let texts = initObject.dependsOnProps.optionTexts;
            let vals = initObject.dependsOnProps.optionTexts;
            for (let i = 0; i < texts.length; i++) {
                let options = "";
                for (let j = 0; j < texts[i].length; j++) {
                    const text = texts[i][j];
                    const val = vals[i][j];
                    options += `<option value="${val}">${text}</option>`;
                }
                allOptions.push(options);
            }
            //Vytvoří se jednotlivé option
            this.input.innerHTML = allOptions[0];

            let parent = document.getElementById(initObject.dependsOnProps.dependsOnID);
            TODO

        } else if (this.type == DETAIL_FIELD_TYPES.SELECTBOX) {
            let options = "";
            let texts = initObject.options.optionTexts;
            let vals = initObject.options.optionTexts;
            for (let i = 0; i < texts.length; i++) {
                const text = texts[i];
                const val = vals[i];
                options += `<option value="${val}">${text}</option>`;
            }
            //Vytvoří se jednotlivé option
            this.input.innerHTML = options;
        } else {
            let val = (initObject && initObject.selectedValue != undefined) ? initObject.selectedValue.toString() : undefined;
            if (!val) {
                new BaseDialogError("Chyba při inicializaci detailu!", this, true);
                return;
            }
            let element = this.input;

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
    slider: HTMLInputElement;
    img: HTMLDivElement;
    private _imgSourceID: string;

    get imgSource(): HTMLInputElement {
        return <HTMLInputElement>document.getElementById(this._imgSourceID);
    }
    constructor(sliderID: string, imgID: string, imgSourceID: string, layoutProps?: IComponentProperties) {
        super(layoutProps);

        this.innerHTML = `        
        <div class="form-label">
            <label for="${sliderID}" class="active-label first-label">Posun obrázku</label>
            <div class="input-field">                     
                <div id="${sliderID}-container">
                    <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${sliderID}">
                </div>   
            </div>
            <label for="${imgID}" class="active-label second-label">Náhled obrázku</label>            
            <div id="${imgID}" class="bordered-img">
            </div>   
        </div>   
        `;
        /*
                this.innerHTML = `          
                    <div id="${sliderID}">
                        <input type="range" min="0" max="1" step="0.01" value="0.8"  class="slider" id="${sliderID}-input">
                    </div>   
                    <div id="${imgID}" class="bordered-img">
                    </div>   
                `*/
        this.slider = this.querySelector("input");
        this.img = this.querySelector("#" + imgID);

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

        this.slider.addEventListener("input", sliderValueChangedHandler);
        this.slider.addEventListener("change", sliderValueChangedHandler);
    }

    connectedCallback(): void {
        this.viewHeight = 162;//this.clientWidth / 5; //162px is standart height when one row is displayed and room name is not wrapped (because of odd css padding, icons height etc...)
        this.img.style.height = this.viewHeight + "px";
        (<HTMLElement>this.parent.parentElement.querySelector(".first-label")).style.top = "-12px";
        (<HTMLElement>this.parent.parentElement.querySelector(".second-label")).style.top = "32px";

        let newBG = `url("${this.bgURL}")`;
        if (newBG != this.img.style.backgroundImage) {
            this.img.style.background = newBG;
            this.img.style.backgroundSize = "cover";
        }

        this.setBgImgOffsetY();
    }

    setBgImgOffsetY() {
        let img = new Image();
        img.addEventListener("load", () => {
            let newHeight = (this.img.clientWidth / img.naturalWidth) * img.naturalHeight - this.viewHeight;
            let newPosY = Math.round(-(newHeight * this.offset)) + "px";
            if (newPosY != this.img.style.backgroundPositionY)
                this.img.style.backgroundPositionY = newPosY;
        });
        img.src = this.bgURL;
    }
}








export enum DETAIL_FIELD_TYPES {
    DEPENDENT_SELECTBOX,
    DISABLED_TEXT_FIELD,
    SELECTBOX,
    SLIDABLE_IMG_PREVIEW,
    TEXT_FIELD
}

interface IDetailRowProps {
    id: string,
    name: string,
    type: DETAIL_FIELD_TYPES,
    data?: any
}

/*
export type IDetailRowInitObject = IDetailRowInitObjectWithVal | IDetailRowInitObjectWithDependantSelectProps | IDetailRowInitObjectWithDependantImgProps;

interface IDetailRowInitObjectWithVal {
    value: string | number | null
}

interface IDetailRowInitObjectWithDependantSelectProps {
    dependsOnProps: null | {
        dependsOnID: string,
        optionValues: Array<string>
        optionTexts: Array<string>
    }
}

interface IDetailRowInitObjectWithDependantImgProps {
    dependsOnID: string
}*/

export interface IDetailRowInitObject {
    selectedValue: string | number | null,
    dependsOnProps?: null | {
        dependsOnID: string,
        optionValues: Array<Array<string>>
        optionTexts: Array<Array<string>>
    },
    options?: {
        optionValues: Array<string>,
        optionTexts: Array<string>
    }
}