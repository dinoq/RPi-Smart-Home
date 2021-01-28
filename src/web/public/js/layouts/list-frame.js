import { AbstractComponent } from "../components/component.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class FrameList extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.itemContainer = new HorizontalStack();
        this.appendComponents(this.itemContainer);
        //this.style.display="flex";
    }
    addItems(components) {
        this.itemContainer.pushComponents(components);
    }
}
FrameList.tagName = "frame-list";
export class FrameListItem extends AbstractComponent {
    constructor(roomName, layoutProps) {
        super(layoutProps);
        this.innerHTML = `
            <div class="room-name">

            </div>
        `;
    }
}
FrameListItem.tagName = "frame-list-item";
