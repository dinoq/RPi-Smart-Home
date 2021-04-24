import { IComponentProperties } from "../components/component.js";
import { ListTypes } from "./list-component.js";
import { BaseDetail, DETAIL_FIELD_TYPES } from "./detail-component.js";

export class AutomationDetail extends BaseDetail {
    static tagName = "automation-detail";


    constructor(saveCallback, cancelCallback, layoutProps?: IComponentProperties) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na.....");
    }


    getElementsToCreate(type: ListTypes): any[] {
        let elementsToCreate = [];
        if (type == ListTypes.TIMEOUT) {
            elementsToCreate = [
                ["automation-name", "Název časovače", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["time", "Doba za jakou má akce nastat (H:m:s)", DETAIL_FIELD_TYPES.TIME_SELECT],
                ["controlled-output", "Nastavovaný výstup", DETAIL_FIELD_TYPES.SELECTBOX],
                ["value-to-set", "Nastavovaná hodnota", DETAIL_FIELD_TYPES.SLIDER],
                ["checkbox-active", "Po uložení časovač aktivovat", DETAIL_FIELD_TYPES.CHECKBOX]
            ];
        } else if (type == ListTypes.SENSORS_AUTOMATIONS) {
            elementsToCreate = [
                ["automation-name", "Název automatizace", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["sensor-input", "Snímač vyvolávající změnu", DETAIL_FIELD_TYPES.SELECTBOX],
                [undefined, undefined, DETAIL_FIELD_TYPES.THRESHOLD_INPUT],
                ["controlled-output", "Měněný výstup", DETAIL_FIELD_TYPES.SELECTBOX],
                ["value-to-set", "Nastavovaná hodnota", DETAIL_FIELD_TYPES.SLIDER],
                ["checkbox-active", "Po uložení automatizaci aktivovat", DETAIL_FIELD_TYPES.CHECKBOX]
            ];
        } 
        return elementsToCreate;
    }


}
