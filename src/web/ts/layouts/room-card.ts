import { AbstractComponent, componentProperties } from "../components/component.js";
import { Firebase } from "../utils/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";

export class RoomCard extends AbstractComponent {
    static tagName = "room-card";
    mainHStack: HorizontalStack;
    leftStack: VerticalStack;
    rightStack: HorizontalStack;
    
    constructor(layoutProps?: RoomCardProps) {
        super(layoutProps);

        this.mainHStack = new HorizontalStack();
        this.leftStack = new VerticalStack();
        this.rightStack = new HorizontalStack();


        this.mainHStack.appendComponents([this.leftStack, this.rightStack]);
        this.appendComponents(this.mainHStack);
    }
}


export interface RoomCardProps extends componentProperties{
    roomName: string
}