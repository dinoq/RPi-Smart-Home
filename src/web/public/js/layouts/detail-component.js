import { EventManager } from "../app/event-manager.js";
import { AbstractComponent } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { BaseDialogError } from "../errors/base-errors.js";
export class BaseDetail extends AbstractComponent {
    //blinkable: string[] = new Array(); // String array of blinkable elements (for query)
    constructor(saveCallback, cancelCallback, layoutProps) {
        super({ ...layoutProps, classList: "detail-component" });
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
        let layoutChanged = false;
        if (type != this.actualFrameListType) { //Layout already created
            this.updateDetailLayout(type);
            layoutChanged = true;
        }
        Array.from(this.rows.children).forEach((row, index) => {
            row.initializeValues(values[index], (event) => { this.readyToSave = true; }, layoutChanged);
        });
    }
    updateDetailLayout(type) {
        this.actualFrameListType = type;
        let elementsToCreate = this.getElementsToCreate(type);
        this.rows.innerHTML = "";
        elementsToCreate.forEach((elementInfo, index) => {
            let detailRowProps = {
                id: elementInfo[0],
                name: elementInfo[1],
                type: elementInfo[2]
            };
            if (detailRowProps.type == DETAIL_FIELD_TYPES.SLIDABLE_IMG_PREVIEW) {
                detailRowProps.data = {
                    imgID: elementInfo[3],
                    imgSourceID: elementInfo[4]
                };
            }
            let row = new DetailRow(detailRowProps);
            AbstractComponent.appendComponentsToDOMElements(this.rows, row);
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
BaseDetail.tagName = "detail-component";
export class DetailRow extends AbstractComponent {
    constructor(detailRowProps, layoutProps) {
        super(layoutProps);
        this.labelName = "";
        this.initializeRow(detailRowProps);
    }
    initializeRow(detailRowProps) {
        let type = detailRowProps.type;
        let id = detailRowProps.id;
        this.labelName = detailRowProps.name;
        this.innerHTML = `        
            <div class="form-label">
                <label for="${id}" class="active-label">${this.labelName}</label>
                <div class="input-field">
                </div>
            </div>
        `;
        this.type = type;
        this.inputID = id;
        let input = this.querySelector(".input-field");
        if (type == DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;
        }
        else if (type == DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD) {
            input.innerHTML = `          
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value="" disabled/> 
            `;
        }
        else if (type == DETAIL_FIELD_TYPES.SELECTBOX) {
            input.innerHTML = `                            
                <select id="${id}" name="${id}">
                </select>
            `;
        }
        else if (type == DETAIL_FIELD_TYPES.SLIDABLE_IMG_PREVIEW) {
            this.innerHTML = "";
            AbstractComponent.appendComponentsToDOMElements(this, new SlidableImg(id, detailRowProps.data.imgID, detailRowProps.data.imgSourceID));
        }
        else if (type == DETAIL_FIELD_TYPES.TEXT_FIELD) {
            input.innerHTML = `        
                <input type="text" id="${id}" onfocusin="" onfocusout="" required autocomplete="off" value=""/>                   
            `;
        }
        else {
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
        };
        ADSelect.addEventListener("input", outputTypeChangedHandler);
        ADSelect.addEventListener("change", outputTypeChangedHandler);
        outputTypeChangedHandler();
    }
    initializeValues(initObject, onInputCallback, layoutChanged) {
        let val = (initObject && initObject.selectedValue != undefined) ? initObject.selectedValue.toString() : undefined;
        this.input.addEventListener("input", onInputCallback);
        if (this.type == DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX) {
            if (!("dependsOnProps" in initObject)) {
                new BaseDialogError("Chyba při inicializaci detailu!", this);
                return;
            }
            let allOptions = [];
            let texts = initObject.dependsOnProps.optionTexts;
            let vals = initObject.dependsOnProps.optionValues;
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
            if (!parent || !(parent instanceof HTMLSelectElement)) {
                new BaseDialogError("Chyba při inicializaci detailu!", this);
                return;
            }
            let parentChangedHandler = () => {
                let selectElem = this.querySelector("select");
                if (!allOptions[parent.selectedIndex]) {
                    let parentLabelName = "";
                    let labelName = "";
                    try {
                        labelName = " (" + this.labelName + ")";
                        parentLabelName = " (" + parent.parentElement.parentElement.querySelector("label").innerText + ")";
                    }
                    catch (error) {
                    }
                    new BaseDialogError(`Chyba při inicializaci detailu! Pro SELECT${labelName} nebyl specifikován seznam hodnot pro zvolenou hodnotu nadřazeného SELECTU${parentLabelName}`, this);
                    return;
                }
                if (selectElem.innerHTML != allOptions[parent.selectedIndex]) { // Options se změní pouze pokud již nejsou aktuálně nastavené (jinak by se při inicializaci tohoto SELECTU v některých případech přepsala inicializační hodnota...)
                    selectElem.innerHTML = allOptions[parent.selectedIndex];
                }
            };
            parentChangedHandler();
            if (layoutChanged) {
                parent.addEventListener("input", parentChangedHandler);
                parent.addEventListener("change", parentChangedHandler);
            }
        }
        else if (this.type == DETAIL_FIELD_TYPES.SELECTBOX) {
            let options = "";
            let texts = initObject.options.optionTexts;
            let vals = initObject.options.optionValues;
            for (let i = 0; i < texts.length; i++) {
                const text = texts[i];
                const val = vals[i];
                options += `<option value="${val}">${text}</option>`;
            }
            //Vytvoří se jednotlivé option
            this.input.innerHTML = options;
        }
        else {
            if (val == undefined) {
                new BaseDialogError("Chyba při inicializaci detailu!", this, true);
                return;
            }
        }
        this.input.value = val;
        if (this.input.value != val) {
            if (this.input instanceof HTMLSelectElement)
                this.input.selectedIndex = 0;
            else if (this.input instanceof HTMLInputElement)
                this.input.value = "";
            new UnknownValueInDatabaseError(val, this.type);
            onInputCallback(); // Call callback to set readyToSave btn active...
        }
        this.input.dispatchEvent(new Event('change')); // We must dispatch event programmatically to get new value immediately
    }
}
DetailRow.tagName = "detail-row";
export class SlidableImg extends AbstractComponent {
    constructor(sliderID, imgID, imgSourceID, layoutProps) {
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
        };
        this.imgSource.addEventListener("input", srcImgChangedHandler);
        this.imgSource.addEventListener("change", srcImgChangedHandler);
        this.bgURL = this.imgSource.value;
        this.offset = Number.parseInt(this.slider.value);
        let sliderValueChangedHandler = () => {
            this.offset = Number.parseFloat(this.slider.value);
            this.connectedCallback();
        };
        this.slider.addEventListener("input", sliderValueChangedHandler);
        this.slider.addEventListener("change", sliderValueChangedHandler);
    }
    get imgSource() {
        return document.getElementById(this._imgSourceID);
    }
    connectedCallback() {
        this.viewHeight = 162; //this.clientWidth / 5; //162px is standart height when one row is displayed and room name is not wrapped (because of odd css padding, icons height etc...)
        this.img.style.height = this.viewHeight + "px";
        this.parent.parentElement.querySelector(".first-label").style.top = "-12px";
        this.parent.parentElement.querySelector(".second-label").style.top = "32px";
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
SlidableImg.tagName = "slidable-img";
export var DETAIL_FIELD_TYPES;
(function (DETAIL_FIELD_TYPES) {
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["DEPENDENT_SELECTBOX"] = 0] = "DEPENDENT_SELECTBOX";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["DISABLED_TEXT_FIELD"] = 1] = "DISABLED_TEXT_FIELD";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SELECTBOX"] = 2] = "SELECTBOX";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["SLIDABLE_IMG_PREVIEW"] = 3] = "SLIDABLE_IMG_PREVIEW";
    DETAIL_FIELD_TYPES[DETAIL_FIELD_TYPES["TEXT_FIELD"] = 4] = "TEXT_FIELD";
})(DETAIL_FIELD_TYPES || (DETAIL_FIELD_TYPES = {}));
