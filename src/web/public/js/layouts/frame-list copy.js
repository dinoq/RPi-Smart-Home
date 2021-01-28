import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent } from "../components/component.js";
import { Icon } from "../components/others/app-icon.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class FrameList extends AbstractComponent {
    constructor(layoutProps) {
        super(Utils.mergeObjects(layoutProps, {
            maxHeight: "25%",
            overflowY: "auto",
            border: "1px solid grey",
            classList: "frame-list"
        }));
        this.initAddItemBtn();
    }
    initAddItemBtn() {
        this.addItemBtn = new FrameListItem();
        let wrapper = new BaseComponent({
            backgroundColor: "#78d7f3",
            borderRadius: "15px",
            padding: "0px 50px",
            margin: "2px",
            justifyContent: "center",
            display: "flex",
            color: "#fff700",
            fontWeight: "bold",
            fontSize: "1.5rem",
            innerText: "+"
        });
        this.addItemBtn.initialize(ItemTypes.TEXT_ONLY, "");
        //this.addItemBtn.initializeFromProps()
        this.addItemBtn.name.appendComponents(wrapper);
    }
    clearItems() {
        this.innerHTML = "";
    }
    updateArrows() {
        let children = this.childNodes;
        let firstWithArrows = null;
        children.forEach((child, index, array) => {
            if (firstWithArrows == null && child.type == ItemTypes.CLASSIC) {
                firstWithArrows = child;
                child.updateArrows(false, true);
            }
            else {
                if (index == array.length - 1) {
                    child.updateArrows(true, false);
                }
                else {
                    child.updateArrows(true, true);
                }
            }
        });
    }
    addItems(item) {
        this.appendComponents(item);
    }
    frmListItemToTableRow(item) {
        let row = document.createElement("tr");
        if (item.up)
            row.appendChild(this.getTableTD(item.up));
        else
            row.appendChild(new BaseComponent());
        if (item.down)
            row.appendChild(this.getTableTD(item.down));
        else
            row.appendChild(new BaseComponent());
        if (item.name)
            row.appendChild(this.getTableTD(item.name));
        else
            row.appendChild(new BaseComponent());
        return row;
    }
    getTableTD(child) {
        let td = document.createElement("td");
        td.appendChild(child);
        return td;
    }
}
FrameList.tagName = "frame-list";
export class FrameListItem extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
    initialize(...args) {
        let onClickCallback = null;
        this.type = args[0];
        if (this.layout)
            this.layout.disconnectComponent();
        this.layout = new HorizontalStack({ padding: "0 10px" });
        if (this.type == ItemTypes.CLASSIC && args.length == 4) {
            this.dbCopy = args[2];
            this.showArrows = args[3];
            this.up = new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)", classList: "up" });
            if (!this.showArrows.up)
                this.up.style.visibility = "hidden";
            this.down = new BaseComponent({ innerText: "▶", transform: "rotate(90deg)", classList: "down" });
            if (!this.showArrows.down)
                this.down.style.visibility = "hidden";
            this.name = new BaseComponent({ innerText: (this.dbCopy != null) ? this.dbCopy.name : "", classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });
            this.edit = new Icon("edit", { marginRight: "10px" });
            this.delete = new Icon("delete");
            this.layout.pushComponents([this.up, this.down, this.name, this.edit, this.delete]);
            onClickCallback = args[1];
        }
        else if (this.type == ItemTypes.TEXT_ONLY && args.length == 2) {
            this.name = new BaseComponent({ innerText: args[1], classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "row", justifyContent: "center", marginLeft: "15px" });
            this.layout.pushComponents([this.name]);
        }
        this.appendComponents(this.layout);
        this.addListeners(onClickCallback);
    }
    updateArrows(upVisible, downVisible) {
        if (this.up) {
            this.up.style.visibility = upVisible ? "visible" : "hidden";
            this.showArrows.up = upVisible;
        }
        if (this.down) {
            this.down.style.visibility = downVisible ? "visible" : "hidden";
            this.showArrows.down = downVisible;
        }
        /*
        if(increment)
            index++
        else
            index--;
        if ((index-startIndex) == 0)
            this.up.style.visibility = "hidden";
        else
            this.up.style.visibility = "visible";
        if (index == maxIndex)
            this.down.style.visibility = "hidden";
        else
            this.down.style.visibility = "visible";*/
    }
    addListeners(onClickCallback) {
        if (onClickCallback) {
            if (this.up)
                this.up.addEventListener("click", (event) => {
                    onClickCallback(event, this, "up");
                    event.stopPropagation();
                });
            if (this.down)
                this.down.addEventListener("click", (event) => {
                    onClickCallback(event, this, "down");
                    event.stopPropagation();
                });
            if (this.edit)
                this.edit.addEventListener("click", (event) => {
                    onClickCallback(event, this, "edit");
                    event.stopPropagation();
                });
            if (this.delete)
                this.delete.addEventListener("click", (event) => {
                    onClickCallback(event, this, "delete");
                    event.stopPropagation();
                });
            this.addEventListener("click", (event) => {
                onClickCallback(event, this);
            });
        }
    }
}
FrameListItem.tagName = "frame-list-item";
export var ItemTypes;
(function (ItemTypes) {
    ItemTypes[ItemTypes["CLASSIC"] = 0] = "CLASSIC";
    ItemTypes[ItemTypes["TEXT_ONLY"] = 1] = "TEXT_ONLY";
})(ItemTypes || (ItemTypes = {}));
