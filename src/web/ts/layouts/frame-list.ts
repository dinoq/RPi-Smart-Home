import { Firebase } from "../app/firebase.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent, IComponentProperties } from "../components/component.js";
import { Icon } from "../components/others/app-icon.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";


export class FrameList extends AbstractComponent {
    static tagName = "frame-list";

    constructor(layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
            maxHeight: "25%",
            overflowY: "scroll",
            border: "1px solid grey",
            classList: "frame-list"
        }));

        let defaultItem = new FrameListItem(null, {up: false, down: false}, null);
        defaultItem.name.innerText="+";
        defaultItem.up.disconnectComponent();
        defaultItem.down.disconnectComponent();
        this.addItems(defaultItem);
    }


    clearItems() {
        this.innerHTML = "";
    }

    addItems(item: FrameListItem | FrameListItem[]) {
        //this.itemContainer.appendChild(this.frmListItemToTableRow(item));
        this.appendComponents(item); 
    }

    frmListItemToTableRow(item: FrameListItem) {
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
    getTableTD(child: HTMLElement) {
        let td = document.createElement("td");
        td.appendChild(child);
        return td;
    }

}


export class FrameListItem extends AbstractComponent {
    static tagName = "frame-list-item";

    private layout: HorizontalStack;
    up: AbstractComponent;
    down: AbstractComponent;
    name: AbstractComponent;
    edit: AbstractComponent;
    delete: AbstractComponent;
    dbCopy: any;

    constructor(db: any, showArrows: {up: boolean, down:boolean}, onClickCallback, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.dbCopy = db;

        this.layout = new HorizontalStack({ padding: "0 10px" });

        this.up = new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)", classList: "up" });
        if (!showArrows.up)
            this.up.style.visibility = "hidden";

        this.down = new BaseComponent({ innerText: "▶", transform: "rotate(90deg)", classList: "down" });
        if (!showArrows.down)
            this.down.style.visibility = "hidden";

        this.name = new BaseComponent({ innerText: (db!=null)?db.name:"", classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });

        this.edit = new Icon("edit", { marginRight: "10px" });

        this.delete = new Icon("delete");

        this.layout.pushComponents([this.up, this.down, this.name, this.edit, this.delete]);


        this.appendComponents(this.layout);

        this.addListeners(onClickCallback);
    }

    updateArrows(index: number, maxIndex, increment: boolean) {
        if(increment)
            index++
        else
            index--;
        if (index == 0)
            this.up.style.visibility = "hidden";
        else
            this.up.style.visibility = "visible";
        if (index == maxIndex)
            this.down.style.visibility = "hidden";
        else
            this.down.style.visibility = "visible";
    }

    addListeners(onClickCallback?): void {
        if (onClickCallback) {
            this.up.addEventListener("click", (event) => {
                onClickCallback(event, this, "up");
                event.stopPropagation()
            })
            this.down.addEventListener("click", (event) => {
                onClickCallback(event, this, "down");
                event.stopPropagation()
            })
            this.edit.addEventListener("click", (event) => {
                onClickCallback(event, this, "edit");
                event.stopPropagation()
            })
            this.delete.addEventListener("click", (event) => {
                onClickCallback(event, this, "delete");
                event.stopPropagation()
            })
            this.addEventListener("click", (event) => {
                onClickCallback(event, this);
            })
        }
    }


}
