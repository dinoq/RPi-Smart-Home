import { PairComponent } from "../components/forms/pair-component.js";
import { BasePage } from "./base-page.js";
export class PairPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.pairForm = new PairComponent({});
        this.appendComponents(this.pairForm);
        /*if(redirectAfterPair != undefined){
            this.pair.redirectAfterPair(redirectAfterPair);
        }*/
    }
}
PairPage.tagName = "pair-page";
