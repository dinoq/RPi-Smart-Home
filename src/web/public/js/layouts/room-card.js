import { AbstractComponent } from "../components/component.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
export class RoomCard extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.mainHStack = new HorizontalStack();
        this.leftStack = new VerticalStack();
        this.rightStack = new HorizontalStack();
        this.mainHStack.appendComponents([this.leftStack, this.rightStack]);
        this.appendComponents(this.mainHStack);
    }
}
RoomCard.tagName = "room-card";
