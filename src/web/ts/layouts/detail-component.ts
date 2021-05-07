import { Board, BoardsManager } from "../app/boards-manager.js";
import { EventManager } from "../app/event-manager.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent, IComponentProperties } from "../components/component.js";
import { UnknownValueInDatabaseError } from "../errors/db-errors.js";
import { ARROWABLE_LISTS, List, ListItem, ListTypes } from "./list-component.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
import { BaseDialogError, BaseSingletonDialogError } from "../errors/base-errors.js";

export abstract class BaseDetail extends AbstractComponent {
    static tagName = "detail-component";

    rows: any;
    actualFrameListType: ListTypes;
    private btnsContainer: HorizontalStack;
    private _saveBtn: HTMLButtonElement;
    private _cancelBtn: HTMLButtonElement;

    private _readyToSave: boolean = false;

    abstract getElementsToCreate(type: ListTypes): any[];

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
        super({ ...layoutProps, classList: "detail-component" });
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

        let form = <HTMLElement>this.querySelector(".form");
        AbstractComponent.appendComponentsToDOMElements(form, [this.btnsContainer]);
    }

    updateTitle(title: string) {
        (<HTMLDivElement>this.querySelector(".editing-name")).innerText = title;
    }

    updateDetail(title: string, type: ListTypes, values) {
        this.updateTitle(title);

        let layoutChanged = false;
        if (type != this.actualFrameListType) { //Layout already created
            this.updateDetailLayout(type);
            layoutChanged = true;
        }

        Array.from(this.rows.children).forEach((row, index) => {
            (<DetailRow>row).initializeValues(values[index], (event) => { this.readyToSave = true }, layoutChanged);
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


    blink(count: number = 3) {
        Array.from(this.rows.children).forEach((row: HTMLElement, index) => {
            let element: HTMLElement = (<HTMLElement>row.querySelector(".input-field").children[0]);
            let className = (count == 1) ? "blink-once" : "blinking";
            if(element)
                element.classList.add(className);
        })

        setTimeout(() => {
            Array.from(this.rows.children).forEach((row: HTMLElement, index) => {
                let element: HTMLElement = (<HTMLElement>row.querySelector(".input-field").children[0]);
                let className = (count == 1) ? "blink-once" : "blinking";
                if(element)
                    element.classList.remove(className);
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
    labelName: string = "";
    constructor(detailRowProps: IDetailRowProps, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.initializeRow(detailRowProps);
    }
    initializeRow(detailRowProps: IDetailRowProps) {
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
        } else if (type == DETAIL_FIELD_TYPES.TIME_SELECT) {
            input.innerHTML = `        
                <div class="time-select">
                    <input type="number" id="${id}-h" value="0" min="0"><div class="colon">:</div>
                    <input type="number" id="${id}-m" value="0" min="0"><div class="colon">:</div>
                    <input type="number" id="${id}-s" value="0" min="0">
                </div>
            `;
        } else if (type == DETAIL_FIELD_TYPES.CHECKBOX) {
            input.innerHTML = `        
                <div class="checkbox-container">
                    <input type="checkbox" id="${id}" value="0">
                </div>
            `;
            this.querySelector("label").style.left = "40px";
            this.querySelector("label").style.top = "-18px";
        } else if (type == DETAIL_FIELD_TYPES.SLIDER) {
            input.innerHTML = `        
                <div class="slider-container">
                    <input type="range" step="1" id="${id}" value="0" min=0 max=1024>
                </div>
            `;
            this.input = input.querySelector("input");
        }else if (type == DETAIL_FIELD_TYPES.THRESHOLD_INPUT) {
            this.innerHTML = "";
            console.log("p c");
            AbstractComponent.appendComponentsToDOMElements(this, new ThresholdInput(id));
        } else {
            new BaseDialogError("Neznámý typ komponenty v detailu!", this);
        }

        if (!this.input && id != undefined) {
            this.input = this.querySelector("#" + id);
        }
    }

    initializeValues(initObject: IDetailRowInitObject, onInputCallback, layoutChanged: boolean) {
        let val = (initObject && initObject.selectedValue != undefined) ? initObject.selectedValue.toString() : undefined;
        let valueAlreadySet = false;

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

            let parent: HTMLSelectElement = <HTMLSelectElement>document.getElementById(initObject.dependsOnProps.dependsOnID);
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
                    } catch (error) {

                    }
                    new BaseDialogError(`Chyba při inicializaci detailu! Pro SELECT${labelName} nebyl specifikován seznam hodnot pro zvolenou hodnotu nadřazeného SELECTU${parentLabelName}`, this);
                    return;
                }
                if (selectElem.innerHTML != allOptions[parent.selectedIndex]) {// Options se změní pouze pokud již nejsou aktuálně nastavené (jinak by se při inicializaci tohoto SELECTU v některých případech přepsala inicializační hodnota...)
                    selectElem.innerHTML = allOptions[parent.selectedIndex];
                }
            }

            parentChangedHandler();
            if (layoutChanged) {
                parent.addEventListener("input", parentChangedHandler);
                parent.addEventListener("change", parentChangedHandler);
            }

        } else if (this.type == DETAIL_FIELD_TYPES.SELECTBOX) {
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
        } else if (this.type == DETAIL_FIELD_TYPES.TIME_SELECT) {
            valueAlreadySet = true;
            let time = Number.parseInt(val);
            let hours = Math.floor(time / 3600);
            time = time - hours * 3600;
            let minutes = Math.floor(time / 60);
            let seconds = time - minutes * 60;

            let validateInput = (event)=>{
                if(!(event.target.value=="" || Number.isSafeInteger(Number.parseInt(event.target.value)))){
                    event.target.value = "0";
                }
                if(Number.parseInt(event.target.value) < 0){
                    event.target.value = "0";
                }
            }
            let hoursInput = (<HTMLInputElement>this.querySelector("#" + this.inputID + "-h"));
            let minutesInput = (<HTMLInputElement>this.querySelector("#" + this.inputID + "-m"));
            let secondsInput = (<HTMLInputElement>this.querySelector("#" + this.inputID + "-s"));

            hoursInput.value = hours.toString();
            minutesInput.value = minutes.toString();
            secondsInput.value = seconds.toString();

            hoursInput.addEventListener("input", onInputCallback);
            hoursInput.addEventListener("input", validateInput);
            minutesInput.addEventListener("input", onInputCallback);
            minutesInput.addEventListener("input", validateInput);
            secondsInput.addEventListener("input", onInputCallback);
            secondsInput.addEventListener("input", validateInput);
        } else if (this.type == DETAIL_FIELD_TYPES.CHECKBOX) {
            (<HTMLInputElement>this.input).checked = (val == "true" || val == true);
            valueAlreadySet = true;
            this.input.addEventListener("input", onInputCallback);

        } else if (this.type == DETAIL_FIELD_TYPES.SLIDER) {

        } else if (this.type == DETAIL_FIELD_TYPES.THRESHOLD_INPUT) {
            valueAlreadySet = true;
            console.log('p initObject: ', initObject);
            (<ThresholdInput>this.querySelector("threshold-input")).initializeValues(initObject, onInputCallback, layoutChanged);
        } else {
            if (val == undefined) {
                new BaseDialogError("Chyba při inicializaci detailu!", this, true);
                return;
            }

        }
        if (!valueAlreadySet) {
            (<HTMLInputElement>this.input).value = val;
            if ((<HTMLInputElement>this.input).value != val) {
                if (this.input instanceof HTMLSelectElement)
                    this.input.selectedIndex = 0;
                else if (this.input instanceof HTMLInputElement)
                    this.input.value = "";

                new UnknownValueInDatabaseError(val, this.type);
                onInputCallback(); // Call callback to set readyToSave btn active...
            }
            this.input.addEventListener("input", onInputCallback);
        }
        if(this.input){            
            this.input.dispatchEvent(new Event('change')); // Vyvolání události na dané položce kvůli ostatním položkám, které na ni jsou případně závislé (např. SlidableImg vyžaduje událost change na slideru i kvůli počátečnímu nastavení obrázku...)
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

export class ThresholdInput extends AbstractComponent{
    static tagName = "threshold-input";
    selectBox: HTMLSelectElement;
    input: HTMLInputElement;

    constructor(id, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.innerHTML = `        
        <div class="form-label">
            <label for="threshold-value-input" class="active-label first-label">Hodnota, při které dojde ke změně</label>
            <div class="input-field">                     
                <div class="threshold-value-container">
                    <select id="threshold-sign">
                        <option value="<">&lt;</option>
                        <option value=">">&gt;</option>
                    </select>
                    <input type="text" id="threshold-value" value=""/> 
                </div>   
            </div>
        </div>   
        `;

        this.selectBox = this.querySelector("select");
        this.input = this.querySelector("input");
    }

    initializeValues(initObject: IDetailRowInitObject, onInputCallback, layoutChanged: boolean) {
        this.selectBox.value = initObject.selectedValue.sign;
        this.selectBox.dispatchEvent(new Event('change')); // Vyvolání události na dané položce kvůli ostatním položkám, které na ni jsou případně závislé (např. SlidableImg vyžaduje událost change na slideru i kvůli počátečnímu nastavení obrázku...)
        this.selectBox.addEventListener("input", onInputCallback);

        this.input.value = initObject.selectedValue.val;
        this.input.dispatchEvent(new Event('change')); // Vyvolání události na dané položce kvůli ostatním položkám, které na ni jsou případně závislé (např. SlidableImg vyžaduje událost change na slideru i kvůli počátečnímu nastavení obrázku...)
        this.input.addEventListener("input", onInputCallback);
    }
}


export enum DETAIL_FIELD_TYPES {
    DEPENDENT_SELECTBOX,
    DISABLED_TEXT_FIELD,
    SELECTBOX,
    SLIDABLE_IMG_PREVIEW,
    TEXT_FIELD,
    TIME_SELECT,
    CHECKBOX,
    SLIDER,
    THRESHOLD_INPUT
}

interface IDetailRowProps {
    id: string,
    name: string,
    type: DETAIL_FIELD_TYPES,
    data?: any
}


export interface IDetailRowInitObject {
    selectedValue: any,
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