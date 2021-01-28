import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent } from "../components/component.js";
import { Icon } from "../components/others/app-icon.js";
import { BaseError } from "../errors/base-error.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class FrameList extends AbstractComponent {
    constructor(type, layoutProps) {
        super({
            ...layoutProps, ...{
                //maxHeight: "25%",
                overflowY: "auto",
                border: "1px solid var(--default-blue-color)",
                borderRadius: "10px",
                //margin: "5px",
                classList: "frame-list",
            }
        });
        this.type = type;
        this.initialize();
    }
    initialize() {
        this.clearItems();
        this.initAddItemBtn();
        if (!this.defaultItem)
            this.defaultItem = new FrameListItem();
        else
            this.addItems(this.defaultItem);
    }
    initDefaultItem(type, text) {
        this.defaultItem.initialize(type, text);
        this.addItems(this.defaultItem);
    }
    initAddItemBtn(callback = null, parentPath = "") {
        this.addItemBtn = new FrameListItem();
        let btn = new BaseComponent({
            backgroundColor: "var(--default-blue-color)",
            borderRadius: "15px",
            padding: "0px 50px",
            margin: "2px",
            justifyContent: "center",
            display: "flex",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.5rem",
            innerText: "+",
            classList: "btn"
        });
        this.addItemBtn.initialize(FrameListTypes.BTN_ONLY, callback);
        this.addItemBtn.dbCopy.parentPath = parentPath;
        //this.addItemBtn.initializeFromProps()
        this.addItemBtn.components[0].appendComponents(btn);
    }
    clearItems() {
        this.innerHTML = "";
    }
    /**
     * Called after order of child items is changed. Edit thongs like order arrows visibility, bottom border visibility (last item has no bottom border) etc...
     */
    updatedOrderHandler() {
        let children = this.childNodes;
        let firstWithArrows = null;
        children.forEach((child, index, array) => {
            child.updateArrows(false, false); // First of all, switch off arrows for case when is only one item in list (because this case don't match any of conditions below)
            let borderBottom = "1px solid var(--default-blue-color)";
            if (firstWithArrows == null
                && Utils.itemIsAnyFromEnum(child.type, FrameListTypes, ARROWABLE_LISTS)
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
        this.appendComponents(item, index);
        this.updatedOrderHandler();
    }
}
FrameList.tagName = "frame-list";
export class FrameListItem extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this._active = false;
        this.components = new Array();
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
    initialize(...args) {
        let onClickCallback = null;
        this.type = args[0];
        if (this.layout)
            this.layout.disconnectComponent();
        let componentIndex = 0;
        let clickedElemsTitles = {};
        this.layout = new HorizontalStack({ padding: "0 10px", classList: "components-wrapper" });
        this.dbCopy = {};
        if (Utils.itemIsAnyFromEnum(this.type, FrameListTypes, ARROWABLE_LISTS)) {
            this.components = new Array(5);
            this.dbCopy = args[2];
            this.text = args[3];
            this.showArrows = args[4];
            this.components[componentIndex++] = new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)", classList: ["up", "frame-list-item-button"] });
            this.components[componentIndex++] = new BaseComponent({ innerText: "▶", transform: "rotate(90deg)", classList: ["down", "frame-list-item-button"] });
            this.components[componentIndex++] = new BaseComponent({ innerText: this.text, classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });
            this.components[componentIndex++] = new Icon("edit", { marginRight: "10px", classList: ["frame-list-item-button"] });
            this.components[componentIndex++] = new Icon("delete", { classList: ["frame-list-item-button"] });
            this.layout.pushComponents(this.components);
            onClickCallback = args[1];
            clickedElemsTitles = { 0: "up", 1: "down", 3: "edit", 4: "delete" };
        }
        else if (this.type == FrameListTypes.MODULES) {
            this.components = new Array(3);
            this.dbCopy = args[2];
            this.text = args[3];
            this.components[componentIndex++] = new BaseComponent({ innerText: this.text, classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });
            this.components[componentIndex++] = new Icon("edit", { marginRight: "10px" });
            this.components[componentIndex++] = new Icon("delete");
            this.layout.pushComponents(this.components);
            onClickCallback = args[1];
            clickedElemsTitles = { 1: "edit", 2: "delete" };
        }
        else if (this.type == FrameListTypes.BTN_ONLY) {
            this.components = new Array(1);
            this.classList.add("no-hover");
            onClickCallback = args[1];
            clickedElemsTitles = { 0: "add" };
            this.components[componentIndex++] = new BaseComponent({ classList: "btn-wrapper", display: "flex", flexDirection: "row", justifyContent: "center", marginLeft: "15px" });
            this.layout.style.justifyContent = "center";
            this.layout.pushComponents(this.components);
        }
        else if (this.type == FrameListTypes.TEXT_ONLY) {
            this.components = new Array(1);
            this.classList.add("no-hover");
            this.text = args[1];
            this.components[componentIndex++] = new BaseComponent({ innerText: this.text, classList: "room-name", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });
            this.layout.style.justifyContent = "center";
            this.layout.pushComponents(this.components);
        }
        else {
            new BaseError("FrameListTypes chyba - " + FrameListTypes[this.type] + " nedefinován v initialize() FrameListItemu", this, true);
        }
        this.appendComponents(this.layout);
        this.addListeners(onClickCallback, clickedElemsTitles);
    }
    addListeners(onClickCallback, clickedElemsTitles) {
        if (!onClickCallback)
            return;
        if (Utils.itemIsAnyFromEnum(this.type, FrameListTypes, [...ARROWABLE_LISTS, "BTN_ONLY"])) {
            for (const indexOfTitle in clickedElemsTitles) {
                if (this.components[indexOfTitle])
                    this.components[indexOfTitle].addEventListener("click", (event) => {
                        onClickCallback(event, this, clickedElemsTitles[indexOfTitle]);
                        event.stopPropagation();
                    });
            }
        }
        if (this.type != FrameListTypes.BTN_ONLY) {
            this.addEventListener("click", (event) => {
                onClickCallback(event, this);
            });
        }
    }
    updateArrows(upVisible, downVisible) {
        if (Utils.itemIsAnyFromEnum(this.type, FrameListTypes, ARROWABLE_LISTS)) {
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
FrameListItem.tagName = "frame-list-item";
export const ARROWABLE_LISTS = ["ROOMS", "MODULES", "SENSORS", "DEVICES"];
export var FrameListTypes;
(function (FrameListTypes) {
    FrameListTypes[FrameListTypes["BASE"] = 0] = "BASE";
    FrameListTypes[FrameListTypes["SENSORS"] = 1] = "SENSORS";
    FrameListTypes[FrameListTypes["DEVICES"] = 2] = "DEVICES";
    FrameListTypes[FrameListTypes["MODULES"] = 3] = "MODULES";
    FrameListTypes[FrameListTypes["ROOMS"] = 4] = "ROOMS";
    FrameListTypes[FrameListTypes["BTN_ONLY"] = 5] = "BTN_ONLY";
    FrameListTypes[FrameListTypes["TEXT_ONLY"] = 6] = "TEXT_ONLY";
})(FrameListTypes || (FrameListTypes = {}));
export const DBTemplates = {
    get ROOMS() {
        return {
            index: 0,
            img: {
                src: "https://houseandhome.com/wp-content/uploads/2018/03/kitchen-trends-16_HH_KB17.jpg",
                offset: 700
            },
            name: "Místnost " + Math.random().toString(36).substring(2, 6).toUpperCase()
        };
    },
    get MODULES() {
        return {
            index: 0,
            in: {},
            out: {},
            name: "Modul " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            type: "ESP8266"
        };
    },
    get SENSORS() {
        return {
            type: "switch",
            index: 0,
            name: "Snímač " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            valueType: "bool",
            unit: "°C",
            value: "on",
            pin: "A0"
        };
    },
    get DEVICES() {
        return {
            type: "switch",
            index: 0,
            name: "Zařízení " + Math.random().toString(36).substring(2, 6).toUpperCase(),
            valueType: "bool",
            unit: "°C",
            value: "on",
            pin: "D1"
        };
    }
};
