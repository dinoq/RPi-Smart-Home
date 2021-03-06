import { EventManager } from "../app/event-manager.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { ListTypes } from "./list-component.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class Detail extends AbstractComponent {
    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(saveCallback, cancelCallback, layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
        this._readyToSave = false;
        this.initialize(saveCallback, cancelCallback);
    }
    set readyToSave(val) {
        if (val) {
            this._saveBtn.classList.add("blink");
            this._saveBtn.style.fontWeight = "bold";
            this._saveBtn.removeAttribute("disabled");
            this._cancelBtn.style.fontWeight = "bold";
            this._cancelBtn.removeAttribute("disabled");
        }
        else {
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
    initialize(saveCallback, cancelCallback) {
        this.innerHTML = `        
            <div class="form-wrapper">
                <div class="form">
                    <div class="editing-name">Pro editaci klikněte na název místnosti/snímače/zařízení</div>
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
            classList: "btns-stack"
        });
        this._cancelBtn = this.btnsContainer.querySelector(".cancel-btn");
        this._cancelBtn.addEventListener("click", () => {
            cancelCallback();
            this.readyToSave = false;
        });
        this._saveBtn = this.btnsContainer.querySelector(".save-btn");
        this._saveBtn.addEventListener("click", saveCallback);
        this.readyToSave = false;
        let form = this.querySelector(".form");
        AbstractComponent.appendComponentsToDOMElements(form, [this.btnsContainer]);
    }
    updateTitle(title) {
        this.querySelector(".editing-name").innerText = title;
    }
    updateDetail(title, type, values) {
        this.updateTitle(title);
        let elementsToCreate;
        if (type == this.actualFrameListType) { //Layout already created
        }
        else { // Create right layout
            this.actualFrameListType = type;
            if (type == ListTypes.ROOMS) {
                elementsToCreate = [
                    ["device-name", "Název místnosti", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["bg-img-src", "URL obrázku na pozadí", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["slider-for-image", "Posun obrázku", DETAIL_FIELD_TYPES.SLIDER_FOR_IMG_PREV],
                    ["img-preview", "Náhled obrázku", DETAIL_FIELD_TYPES.IMG_PREVIEW]
                ];
            }
            else if (type == ListTypes.MODULES) {
                elementsToCreate = [
                    ["device-name", "Název modulu", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["module-id", "ID modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD],
                    ["module-type", "Typ modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD]
                ];
            }
            else if (type == ListTypes.SENSORS) {
                elementsToCreate = [
                    ["device-name", "Název snímače (nepovinné)", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["input-type", "Typ vstupu", DETAIL_FIELD_TYPES.SELECT_SENSOR_TYPE],
                    ["input", "Vstup", DETAIL_FIELD_TYPES.SELECT_SENSOR_INPUT],
                    ["unit", "Způsob zobrazení", DETAIL_FIELD_TYPES.SELECT_INPUT_UNIT],
                    ["icon-type", "Ikona", DETAIL_FIELD_TYPES.SELECT_INPUT_ICON_TYPE]
                ];
            }
            else if (type == ListTypes.DEVICES) {
                elementsToCreate = [
                    ["device-name", "Název zařízení", DETAIL_FIELD_TYPES.TEXT_FIELD],
                    ["output-type", "Typ výstupu", DETAIL_FIELD_TYPES.SELECT_OUTPUT_TYPE],
                    ["output", "Výstup", DETAIL_FIELD_TYPES.SELECT_DEVICE_OUTPUT],
                    ["icon-type", "Ikona", DETAIL_FIELD_TYPES.SELECT_OUTPUT_ICON_TYPE]
                ];
            }
            this.rows.innerHTML = "";
            elementsToCreate.forEach((elementInfo, index) => {
                let detailRowProps = {
                    id: elementInfo[0],
                    name: elementInfo[1],
                    type: elementInfo[2]
                };
                let row = new DetailRow(detailRowProps);
                AbstractComponent.appendComponentsToDOMElements(this.rows, row);
            });
        }
        Array.from(this.rows.children).forEach((row, index) => {
            let val = ((typeof values[index] == "string")) ? values[index] : (values[index])?.toString();
            row.initialize(val, (event) => { this.readyToSave = true; });
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
Detail.tagName = "detail-component";
export class DetailRow extends AbstractComponent {
    constructor(detailRowProps, layoutProps) {
        super(Utils.mergeObjects(layoutProps, {}));
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
    initializeRow(detailRowProps) {
        let type = detailRowProps.type;
        let id = detailRowProps.id;
        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${name}</label>
                <div class="input-field">
                </div>
            </div>
        `;
        let input = this.querySelector(".input-field");
        if (type == DETAIL_FIELD_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        }
        else if (type == DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        }
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
        };
        ADSelect.addEventListener("input", outputTypeChangedHandler);
        ADSelect.addEventListener("change", outputTypeChangedHandler);
        outputTypeChangedHandler();
    }
    initialize(val, onInputCallback) {
        if (Utils.itemIsAnyFromEnum(this.type, DETAIL_FIELD_TYPES, ["IMG_PREVIEW"])) { // Don't set value directly!
        }
        else {
            let element = this.input;
            if (this.type == DETAIL_FIELD_TYPES.SLIDER_FOR_IMG_PREV)
                element = this.input.querySelector("input");
            element.value = val;
            element.addEventListener("input", onInputCallback);
            if (element.value != val) {
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
DetailRow.tagName = "detail-row";
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
export var DETAIL_FIELD_TYPES;
(function (DETAIL_FIELD_TYPES) {
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["DISABLED_TEXT_FIELD"] = 0] = "DISABLED_TEXT_FIELD";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["TEXT_FIELD"] = 1] = "TEXT_FIELD";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SLIDER_FOR_IMG_PREV"] = 2] = "SLIDER_FOR_IMG_PREV";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["IMG_PREVIEW"] = 3] = "IMG_PREVIEW";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECTBOX"] = 4] = "SELECTBOX";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["DEPENDENT_SELECTBOX"] = 5] = "DEPENDENT_SELECTBOX";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_SENSOR_TYPE"] = 6] = "SELECT_SENSOR_TYPE";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_SENSOR_INPUT"] = 7] = "SELECT_SENSOR_INPUT";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_OUTPUT_TYPE"] = 8] = "SELECT_OUTPUT_TYPE";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_DEVICE_OUTPUT"] = 9] = "SELECT_DEVICE_OUTPUT";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_OUTPUT_ICON_TYPE"] = 10] = "SELECT_OUTPUT_ICON_TYPE";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_INPUT_ICON_TYPE"] = 11] = "SELECT_INPUT_ICON_TYPE";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECT_INPUT_UNIT"] = 12] = "SELECT_INPUT_UNIT";
})(DETAIL_FIELD_TYPES || (DETAIL_FIELD_TYPES = {}));
