import { Utils } from "../../app/utils";
import { AbstractComponent } from "../component";
export class AppOverlay extends AbstractComponent {
    constructor(zIndex, componentProps) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": zIndex
        }));
    }
}
AppOverlay.tagName = "app-overlay";
