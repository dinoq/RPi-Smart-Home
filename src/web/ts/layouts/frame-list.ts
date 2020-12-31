import { Firebase } from "../app/firebase.js";
import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent, IComponentProperties } from "../components/component.js";
import { Icon } from "../components/others/app-icon.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";


export class FrameList extends AbstractComponent {
    static tagName = "frame-list";
    defaultItem: FrameListItem;
    addItemBtn: FrameListItem;
    type: FrameListTypes;

    constructor(type: FrameListTypes, layoutProps?: IComponentProperties) {
        super(Utils.mergeObjects(layoutProps, {
            maxHeight: "25%",
            overflowY: "auto",
            border: "1px solid var(--default-blue-color)",
            borderRadius: "10px",
            //margin: "5px",
            classList: "frame-list",

        }));

        this.type = type;
        this.initialize();

    }
    
    initialize(){
        this.clearItems();
        this.initAddItemBtn();
        if(!this.defaultItem)
            this.defaultItem = new FrameListItem();
        else
            this.addItems(this.defaultItem);
    }

    initDefaultItem(type: ItemTypes, text: string){        
        this.defaultItem.initialize(type, text);
        this.addItems(this.defaultItem);
    }

    initAddItemBtn() {
        this.addItemBtn = new FrameListItem();

        let btn = new BaseComponent({
            backgroundColor: "var(--default-blue-color)",//#78d7f3
            borderRadius: "15px",
            padding: "0px 50px",
            margin: "2px",
            justifyContent: "center",
            display: "flex",
            color: "white",//"#fff700",
            fontWeight: "bold",
            fontSize: "1.5rem",
            innerText: "+",
            classList: "btn"
        });
        this.addItemBtn.initialize(ItemTypes.BTN_ONLY, "");
        //this.addItemBtn.initializeFromProps()
        this.addItemBtn.components[ComponentsBtnOnly.btn].appendComponents(btn);
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
            let borderBottom = "1px solid var(--default-blue-color)";
            if (firstWithArrows == null && (<FrameListItem>child).type == ItemTypes.CLASSIC) {
                firstWithArrows = child;
                (<FrameListItem>child).updateArrows(false, true);
            } else {
                if (index == array.length - 1) {
                    (<FrameListItem>child).updateArrows(true, false);
                    borderBottom = "none";
                } else {
                    (<FrameListItem>child).updateArrows(true, true);
                }
            }
            (<FrameListItem>child).style.borderBottom = borderBottom;
        });
    }

    addItems(item: FrameListItem | FrameListItem[]) {
        this.appendComponents(item);
    }

}


export class FrameListItem extends AbstractComponent {
    static tagName = "frame-list-item";

    private layout: HorizontalStack;
    public components: Array<any>;
    type: ItemTypes;
    dbCopy: any;
    showArrows: { up: boolean, down: boolean };

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.components = new Array();
    }

    initialize(...args) {
        let onClickCallback = null;
        this.type = args[0];
        if (this.layout)
            this.layout.disconnectComponent();
        this.layout = new HorizontalStack({ padding: "0 10px", classList: "components-wrapper" });
        if (this.type == ItemTypes.CLASSIC && args.length == 4) {
            this.components = new Array(5);
            this.dbCopy = args[2];
            this.showArrows = args[3];

            this.components[ComponentsClassic.up] = new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)", classList: "up" });
            /*if (!this.showArrows.up)
                this.components[ComponentsClassic.up].style.visibility = "hidden";*/

            this.components[ComponentsClassic.down] = new BaseComponent({ innerText: "▶", transform: "rotate(90deg)", classList: "down" });
            /*if (!this.showArrows.down)
                this.components[ComponentsClassic.down].style.visibility = "hidden";*/

            this.components[ComponentsClassic.name] = new BaseComponent({ innerText: (this.dbCopy != null) ? this.dbCopy.name : "", classList: "room-name", flexGrow: "1", display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "15px" });

            this.components[ComponentsClassic.edit] = new Icon("edit", { marginRight: "10px" });

            this.components[ComponentsClassic.delete] = new Icon("delete");

            this.layout.pushComponents(this.components);
            onClickCallback = args[1];

        } else if (this.type == ItemTypes.TEXT_ONLY && args.length == 2) {
            this.components = new Array(1);
            this.classList.add("no-hover");
            this.components[ComponentsTextOnly.text] = new BaseComponent({ innerText: args[1], classList: "text", flexGrow: "1", display: "flex", flexDirection: "row", justifyContent: "center", marginLeft: "15px" });

            this.layout.pushComponents(this.components);

        }else if (this.type == ItemTypes.BTN_ONLY && args.length == 2) {
            this.components = new Array(1);
            this.classList.add("no-hover");
            this.components[ComponentsBtnOnly.btn] = new BaseComponent({ innerText: args[1], classList: "btn-wrapper", flexGrow: "1", display: "flex", flexDirection: "row", justifyContent: "center", marginLeft: "15px" });

            this.layout.pushComponents(this.components);

        }

        this.appendComponents(this.layout);


        this.addListeners(onClickCallback);
    }

    updateArrows(upVisible: boolean, downVisible: boolean) {
        if(this.type == ItemTypes.CLASSIC){
            if (this.components[ComponentsClassic.up]) {
                this.components[ComponentsClassic.up].style.visibility = upVisible ? "visible" : "hidden";
                this.showArrows.up = upVisible;
            }
            if (this.components[ComponentsClassic.down]) {
                this.components[ComponentsClassic.down].style.visibility = downVisible ? "visible" : "hidden";
                this.showArrows.down = downVisible;
            }
        }
    }

    addListeners(onClickCallback?): void {
        if (onClickCallback) {
            if(this.type == ItemTypes.CLASSIC){
                if (this.components[ComponentsClassic.up])
                    this.components[ComponentsClassic.up].addEventListener("click", (event) => {
                        onClickCallback(event, this, "up");
                        event.stopPropagation()
                    })
                if (this.components[ComponentsClassic.down])
                    this.components[ComponentsClassic.down].addEventListener("click", (event) => {
                        onClickCallback(event, this, "down");
                        event.stopPropagation()
                    })
                if (this.components[ComponentsClassic.edit])
                    this.components[ComponentsClassic.edit].addEventListener("click", (event) => {
                        onClickCallback(event, this, "edit");
                        event.stopPropagation()
                    })
                if (this.components[ComponentsClassic.delete])
                    this.components[ComponentsClassic.delete].addEventListener("click", (event) => {
                        onClickCallback(event, this, "delete");
                        event.stopPropagation()
                    })

            }
            this.addEventListener("click", (event) => {
                onClickCallback(event, this);
            })
        }
    }


}

enum ComponentsClassic{
    up,
    down,
    name,
    edit,
    delete,
}
enum ComponentsTextOnly{
    text
}
enum ComponentsBtnOnly{
    btn
}
export enum ItemTypes {
    CLASSIC,
    TEXT_ONLY,
    BTN_ONLY
}

export enum FrameListTypes{
    BASE,
    SENSORS,
    DEVICES,
    ROOMS
}