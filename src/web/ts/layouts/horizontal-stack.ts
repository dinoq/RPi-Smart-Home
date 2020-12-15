import { AbstractComponent, componentProperties } from "../components/component.js";
import { RoomDevice } from "./room-card.js";

export class HorizontalStack extends AbstractComponent {
    static tagName = "horizontal-stack";
    
    constructor(layoutProps?: componentProperties) {
        super(layoutProps);
    }
    
    pushComponent(component: AbstractComponent) {
        this.appendComponents(component);
    }

}
