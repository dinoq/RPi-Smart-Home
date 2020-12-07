import { ComponentNameNotDefinedError, CustomComponentNotDefinedError } from "../errors/component-errors.js";
import { MethodNotImplementedError } from "../errors/method-errors.js";
import { Config } from "../utils/config.js";
import { LoginComponent } from "./forms/login.js";

export declare var firebase: any;

export class Component extends HTMLElement {
    protected firebase: any;
    protected parent: HTMLElement;
    public observedAttributes;
    static get observedAttributes() {
        if(Config.showObservedAttrNotDefined){
            console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
            "Will use empty array ([])\n" + 
            "See class PageCompnent for inspiration.");
        }
        //return ['disabled', 'open'];//example
        return [];
    }
    
   /* static _className = "";
    get className(){
        new ComponentNameNotDefinedError();
        return "";
    }*/

    constructor(componentProps: componentProperties) {
        try {
            super();
            this.firebase = firebase;
        }
        catch(e: any) {   
            console.log(e.message);
            let error = e.stack.toString().substring(0,e.stack.toString().length);
            let classes = error.split("at new ").slice(1);
            classes.forEach((str, index, array) => {
                classes[index] = str.substring(0, str.indexOf(" "));
            })
            console.log(classes);
            /*
            console.log('ess: ', e.toString().substring(10,20));
            console.log('e: ', e.);
            let str = <string>e.toString().substring(10,200);
            let classes = str.split("at new");
            console.log('classes: ', classes);*/
            new CustomComponentNotDefinedError(classes);   
            super();
        }

    }
}
export abstract class AbstractComponent extends Component {
    componentProps: any;
    constructor(componentProps: componentProperties) {
        super(componentProps);
        this.componentProps = componentProps;
        this.initialize(componentProps);
    }


    initialize(componentProps: componentProperties): void {
        for(const property in componentProps){
            if(this.style[property] != undefined){//Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            }else{//Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        if(!this.style.display){ //If not set
            this.style.display="block";
        }
    }
    addListeners(): void{
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback(): void{
        if(Config.showConnectedCallbackNotImplemented){
            new MethodNotImplementedError("connectedCallback", this, true);
        }
    }
    disconnectedCallback(): void{
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal): void{
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }

    disconnectComponent() {
        this.parent.removeChild(this);
    }

    connectComponent(parent: string | HTMLElement, replaceContent: boolean = false) {
        if(typeof parent ==  "string"){
            this.parent = document.getElementById(parent);
        }else{
            this.parent = parent;
        }
        if (!this.parent)
            return;

        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        this.parent.appendChild(this);
        this.addListeners();
    }

}

export interface componentProperties{
    componentName?: string,
    componentClassName?: string,
    title?: string,
    x?: string,
    y?: string,
    width?: string,
    height?: string,
    backgroundColor?: string,
    display?: string,
    resizable?
}
