import { Utils } from "../../app/utils";
import { AbstractComponent, IComponentProperties } from "../component";

export class AppOverlay extends AbstractComponent {
    static tagName = "app-overlay";

    constructor(zIndex: number, componentProps?: IComponentProperties) {
        super(Utils.mergeObjects(componentProps, {
            "z-index": zIndex
        }));

    }

}