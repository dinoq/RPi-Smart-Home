import { AbstractComponent, IComponentProperties } from "../components/component.js";
import { RoomDevice } from "./room-card.js";

export class HorizontalStack extends AbstractComponent {
    static tagName = "horizontal-stack";
    
    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.style.display="flex";
    }
    
    pushComponents = this.appendComponents;

}
