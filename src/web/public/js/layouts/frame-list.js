import { AbstractComponent, BaseComponent } from "../components/component.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class FrameList extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.itemContainer = document.createElement("table");
        this.appendComponents(this.itemContainer);
    }
    clearItems() {
        this.itemContainer.innerHTML = "";
    }
    addItems(components) {
        //this.itemContainer.pushComponents(<AbstractComponent><unknown>components);
    }
    frmListItemToTableRow(item) {
    }
}
FrameList.tagName = "frame-list";
export class FrameListItem extends AbstractComponent {
    constructor(roomName, showArrows, layoutProps) {
        super(layoutProps);
        this.layout = new HorizontalStack();
        if (showArrows.up) {
            let up = new BaseComponent({ innerText: "▶", transform: "rotate(-90deg)" });
            console.log("UP", up.clientWidth);
            this.layout.pushComponents(up);
        }
        if (showArrows.down) {
            let down = new BaseComponent({ innerText: "▶", transform: "rotate(90deg)" });
            this.layout.pushComponents(down);
        }
        let name = new BaseComponent({ innerText: roomName });
        this.layout.pushComponents(name);
        this.appendComponents(this.layout);
    }
}
FrameListItem.tagName = "frame-list-item";
