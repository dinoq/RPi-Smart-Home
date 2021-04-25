import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent } from "../components/component.js";
import { Icon } from "../components/others/app-icon.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
export class List extends AbstractComponent {
    constructor(hierarchyLevel, listProps, layoutProps) {
        super({
            ...layoutProps, ...{
                //maxHeight: "25%",
                overflowY: "auto",
                border: "1px solid var(--default-blue-color)",
                borderRadius: "10px",
                //margin: "5px",
                classList: "list-component",
            }
        });
        this.FLItems = new Array();
        this.hierarchyLevel = hierarchyLevel;
        this.layout = new VerticalStack();
        this.listItemsContainer = new VerticalStack();
        this.addBtnContainer = new BaseComponent({});
        this.layout.appendComponents(this.addBtnContainer);
        this.layout.appendComponents(this.listItemsContainer);
        this.initAddItemBtn(listProps.addBtnCallback);
        this.type = listProps.type;
        this.appendComponents(this.layout);
    }
    reinitializeList() {
        this.clearItems();
        if (!this.defaultItem)
            this.defaultItem = new ListItem();
        AbstractComponent.appendComponentsToDOMElements(this.listItemsContainer, this.defaultItem);
    }
    initDefaultItem(type, text, disableAddBtn = false) {
        this.clearItems();
        this.defaultItem = new ListItem();
        //this.defaultItem.initialize(type, text);
        this.defaultItem.initializeItem({
            type: type,
            expandableText: text
        });
        this.listItemsContainer.appendComponents(this.defaultItem);
        if (disableAddBtn) {
            this.disableAddBtn();
        }
    }
    enableAddBtn() {
        this.addItemBtn.querySelector(".btn").classList.remove("disabled");
    }
    disableAddBtn() {
        this.addItemBtn.querySelector(".btn").classList.add("disabled");
    }
    initAddItemBtn(callback) {
        this.addItemBtn = new ListItem();
        let btn = new BaseComponent({
            innerText: "+",
            classList: ["btn", "add-btn"]
        });
        //this.addItemBtn.initialize(ListTypes.BTN_ONLY, callback);
        this.addItemBtn.initializeItem({
            type: ListTypes.BTN_ONLY,
            onClickCallback: callback
        });
        //this.addItemBtn.initializeFromProps()
        this.addItemBtn.components[0].appendComponents(btn);
        AbstractComponent.appendComponentsToDOMElements(this.addBtnContainer, this.addItemBtn, 0);
    }
    updateAddItemBtn(parentPath) {
        this.addItemBtn.dbCopy.parentPath = parentPath;
    }
    getItemIndex(item) {
        if (item == this.addItemBtn) {
            return -2;
        }
        return Array.from(this.listItemsContainer.childNodes).indexOf(item);
    }
    clearItems() {
        this.listItemsContainer.innerHTML = "";
    }
    /**
     * Called after order of child items is changed. Edit thongs like order arrows visibility, bottom border visibility (last item has no bottom border) etc...
     */
    updatedOrderHandler() {
        let children = this.listItemsContainer.childNodes;
        let firstWithArrows = null;
        children.forEach((child, index, array) => {
            child.updateArrows(false, false); // First of all, switch off arrows for case when is only one item in list (because this case don't match any of conditions below)
            let borderBottom = "1px solid var(--default-blue-color)";
            if (firstWithArrows == null
                && Utils.itemIsAnyFromEnum(child.type, ListTypes, ARROWABLE_LISTS)
                && (index != array.length - 1)) { // First (AND NOT LAST)
                firstWithArrows = child;
                child.updateArrows(false, true);
            }
            else if (firstWithArrows != null) { // If not first
                if (index == array.length - 1) { // Last
                    child.updateArrows(true, false);
                    borderBottom = "none";
                }
                else { // In the middle
                    child.updateArrows(true, true);
                }
            }
            child.style.borderBottom = borderBottom;
        });
    }
    addItems(item, index = -1) {
        AbstractComponent.appendComponentsToDOMElements(this.listItemsContainer, item, index);
        this.updatedOrderHandler();
        /*
                let addToFLItems = (itm: ListItem) =>{
                    if(Utils.itemIsAnyFromEnum(itm.type, ListTypes, CLASSIC_FRAME_LIST_TYPES)){
                        this.FLItems.push(itm);
                    }
                };
                if(Array.isArray(item)){
                    item.forEach((itm) =>{
                        addToFLItems(itm);
                    })
                }else{
                    addToFLItems(item);
                }*/
    }
    getItems() {
        return {
            addBtnItem: this.addItemBtn,
            items: Array.from(this.listItemsContainer.childNodes)
        };
    }
}
List.tagName = "list-component";
export class ListItem extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this._active = false;
    }
    get expandableText() {
        return this._text;
    }
    set expandableText(val) {
        if (val == undefined) {
            this._text = undefined;
        }
        else {
            if (val.length)
                this._text = val;
            else
                this._text = "(Bez názvu)";
        }
    }
    get active() {
        return this._active;
    }
    set active(val) {
        this._active = val;
        if (val)
            this.classList.add("active");
        else
            this.classList.remove("active");
    }
    initializeItem(itemProps) {
        this.type = itemProps.type;
        if (this.layout)
            this.layout.disconnectComponent();
        this.components = new Array();
        let componentIndex = 0;
        let clickedElemsTitles = new Array();
        this.layout = new HorizontalStack({ padding: "0 10px", classList: "components-wrapper" });
        this.dbCopy = (itemProps.dbCopy) ? itemProps.dbCopy : {};
        this.showArrows = (itemProps.showArrows) ? itemProps.showArrows : undefined;
        this.expandableText = (itemProps.expandableText) ? itemProps.expandableText : undefined;
        this.editable = (itemProps.editable) ? itemProps.editable : undefined;
        this.deletable = (itemProps.deletable) ? itemProps.deletable : undefined;
        if (this.showArrows != undefined) {
            this.components.push(new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)", classList: ["up", "list-item-button"] }));
            clickedElemsTitles.push("up");
            this.components.push(new BaseComponent({ innerText: "▶", transform: "rotate(90deg)", classList: ["down", "list-item-button"] }));
            clickedElemsTitles.push("down");
        }
        if (itemProps.checkable != undefined) {
            this.checkbox = document.createElement("input");
            this.checkbox.type = "checkbox";
            this.checkbox.style.alignSelf = "center";
            this.checkboxLabel = new BaseComponent({ innerText: "(neaktivní)", marginLeft: "10px", classList: "opaque", alignSelf: "center" });
            //let stack = new HorizontalStack({ alignItems: "center", classList: "opaque" });
            this.components.push(this.checkbox);
            clickedElemsTitles.push("checkbox");
            this.components.push(this.checkboxLabel);
            clickedElemsTitles.push("not-clickable");
        }
        /*
                if (itemProps.checkable != undefined) {
                    this.checkbox = document.createElement("input");
                    this.checkbox.type = "checkbox";
                    this.checkboxLabel = new BaseComponent({ innerText: "(neaktivní)", marginLeft: "10px" });
                    let stack = new HorizontalStack({ alignItems: "center", classList: "opaque" });
                    AbstractComponent.appendComponentsToDOMElements(stack, [this.checkbox, this.checkboxLabel]);
        
                    this.components.push(stack);
                    clickedElemsTitles.push("checkbox");
                }*/
        if (this.expandableText != undefined) {
            if (this.expandableText.endsWith("undefined")) {
                this.expandableText = this.expandableText.substring(0, this.expandableText.lastIndexOf("undefined"));
            }
            if (this.type == ListTypes.TEXT_ONLY) {
                this.classList.add("no-hover");
                this.components.push(new BaseComponent({ innerText: this.expandableText, classList: "room-name", flexDirection: "column", justifyContent: "center", marginLeft: "15px" }));
                clickedElemsTitles.push("not-clickable");
                this.layout.style.justifyContent = "center";
            }
            else {
                let textComponent = new BaseComponent({
                    innerText: this.expandableText, classList: "room-name", flexGrow: "1",
                    display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px"
                });
                this.components.push(textComponent);
                clickedElemsTitles.push(undefined);
                if (itemProps.checkable != undefined) {
                    textComponent.style.marginLeft = "0px";
                    textComponent.style.paddingLeft = "10px";
                }
            }
        }
        if (this.editable) {
            this.components.push(new Icon("edit", { marginRight: "10px", classList: ["list-item-button"] }));
            clickedElemsTitles.push("edit");
        }
        if (this.deletable) {
            this.components.push(new Icon("delete", { classList: ["list-item-button"] }));
            clickedElemsTitles.push("delete");
        }
        if (this.type == ListTypes.BTN_ONLY) {
            this.classList.add("no-hover");
            this.components.push(new BaseComponent({ classList: "btn-wrapper", display: "flex", flexDirection: "row", justifyContent: "center", marginLeft: "15px" }));
            clickedElemsTitles.push("add");
            this.layout.style.justifyContent = "center";
        }
        this.layout.pushComponents(this.components);
        this.appendComponents(this.layout);
        this.addListeners(itemProps.onClickCallback, clickedElemsTitles);
    }
    addListeners(onClickCallback, clickedElemsTitles) {
        if (!onClickCallback)
            return;
        for (const indexOfTitle in clickedElemsTitles) {
            if (this.components[indexOfTitle])
                if (clickedElemsTitles[indexOfTitle] == "not-clickable") {
                    continue;
                }
            this.components[indexOfTitle].addEventListener("click", (event) => {
                //V případě že by bylo kliknuto na neaktivní tlačítko pro přidávání objektů, tak se nestane nic, jinak se zavolá onClickCallback()
                if (clickedElemsTitles[indexOfTitle] == "add" && Array.from(this.components[indexOfTitle].querySelector(".btn").classList).includes("disabled")) {
                    return;
                }
                onClickCallback(event, this, clickedElemsTitles[indexOfTitle], true);
                event.stopPropagation();
            });
        }
        if (this.type != ListTypes.BTN_ONLY) {
            this.addEventListener("click", (event) => {
                onClickCallback(event, this);
            });
        }
    }
    resetTimeout(timeoutCallback, seconds, secondsCallback) {
        if (this._timeout)
            clearTimeout(this._timeout);
        this._timeout = setTimeout(timeoutCallback, seconds * 1000);
        this._secondsRemaining = seconds;
        let tickTimeout = () => {
            this._secondsRemaining--;
            if (this._secondsRemaining > 0) {
                secondsCallback(this._secondsRemaining);
                setTimeout(tickTimeout, 1000);
            }
        };
        setTimeout(tickTimeout, 1000);
    }
    clearTimeout() {
        if (this._timeout)
            clearTimeout(this._timeout);
        this._secondsRemaining = 0;
    }
    updateArrows(upVisible, downVisible) {
        if (Utils.itemIsAnyFromEnum(this.type, ListTypes, ARROWABLE_LISTS)) {
            let componentIndex = 0;
            if (this.components[componentIndex]) {
                this.components[componentIndex].style.visibility = upVisible ? "visible" : "hidden";
                this.showArrows.up = upVisible;
            }
            if (this.components[++componentIndex]) {
                this.components[componentIndex].style.visibility = downVisible ? "visible" : "hidden";
                this.showArrows.down = downVisible;
            }
        }
    }
}
ListItem.tagName = "list-item";
export const ARROWABLE_LISTS = ["ROOMS", "MODULES", "SENSORS", "DEVICES"];
export const CLASSIC_FRAME_LIST_TYPES = ["ROOMS", "MODULES", "SENSORS", "DEVICES"];
export var ListTypes;
(function (ListTypes) {
    ListTypes[ListTypes["BASE"] = 0] = "BASE";
    ListTypes[ListTypes["SENSORS"] = 1] = "SENSORS";
    ListTypes[ListTypes["DEVICES"] = 2] = "DEVICES";
    ListTypes[ListTypes["MODULES"] = 3] = "MODULES";
    ListTypes[ListTypes["ROOMS"] = 4] = "ROOMS";
    ListTypes[ListTypes["BTN_ONLY"] = 5] = "BTN_ONLY";
    ListTypes[ListTypes["TEXT_ONLY"] = 6] = "TEXT_ONLY";
    ListTypes[ListTypes["TIMEOUT"] = 7] = "TIMEOUT";
    ListTypes[ListTypes["SENSORS_AUTOMATIONS"] = 8] = "SENSORS_AUTOMATIONS";
})(ListTypes || (ListTypes = {}));
