import { Config } from "../app/config.js";
import { IComponentProperties } from "../components/component.js";
import { PairComponent } from "../components/forms/pair-component.js";
import { BasePage } from "./base-page.js";

export class PairPage extends BasePage{
    static tagName = "pair-page";

    pairForm: PairComponent;    
    constructor(componentProps?: IComponentProperties){
        super(componentProps);
        
        this.pairForm = new PairComponent({});
        this.appendComponents(this.pairForm);

        /*if(redirectAfterPair != undefined){
            this.pair.redirectAfterPair(redirectAfterPair);
        }*/
    }
    
}