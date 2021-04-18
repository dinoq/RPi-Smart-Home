import { ListTypes } from "./list-component.js";
import { BaseDetail, DETAIL_FIELD_TYPES } from "./detail-component.js";
export class SettingsDetail extends BaseDetail {
    constructor(saveCallback, cancelCallback, layoutProps) {
        super(saveCallback, cancelCallback, layoutProps);
        this.updateTitle("Pro editaci klikněte na název místnosti/snímače/zařízení");
    }
    getElementsToCreate(type) {
        let elementsToCreate = [];
        if (type == ListTypes.ROOMS) {
            elementsToCreate = [
                ["device-name", "Název místnosti", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["bg-img-src", "URL obrázku na pozadí", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["slider-for-image", "Náhled obrázku", DETAIL_FIELD_TYPES.SLIDABLE_IMG_PREVIEW, "img-preview", "bg-img-src"],
            ];
        }
        else if (type == ListTypes.MODULES) {
            elementsToCreate = [
                ["device-name", "Název modulu", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["module-id", "ID modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD],
                ["module-type", "Typ modulu", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD],
                ["module-ip", "IP adresa", DETAIL_FIELD_TYPES.DISABLED_TEXT_FIELD]
            ];
        }
        else if (type == ListTypes.SENSORS) {
            elementsToCreate = [
                ["device-name", "Název snímače (nepovinné)", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["input-type", "Typ vstupu", DETAIL_FIELD_TYPES.SELECTBOX],
                ["input", "Vstup", DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX],
                ["unit", "Způsob zobrazení", DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX],
                ["icon-type", "Ikona", DETAIL_FIELD_TYPES.DEPENDENT_SELECTBOX]
            ];
        }
        else if (type == ListTypes.DEVICES) {
            elementsToCreate = [
                ["device-name", "Název zařízení", DETAIL_FIELD_TYPES.TEXT_FIELD],
                ["output-type", "Typ výstupu", DETAIL_FIELD_TYPES.SELECTBOX],
                ["output", "Výstup", DETAIL_FIELD_TYPES.SELECTBOX],
                ["icon-type", "Ikona", DETAIL_FIELD_TYPES.SELECTBOX]
            ];
        }
        return elementsToCreate;
    }
}
SettingsDetail.tagName = "settings-detail";
