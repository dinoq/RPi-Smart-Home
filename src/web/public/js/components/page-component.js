import { BaseError } from "../errors/base-error.js";
import { CustomComponentNotDefinedError } from "../errors/component-errors.js";
import { MethodNotImplementedError } from "../errors/method-errors.js";
import { Config } from "../utils/config.js";
export class Component extends HTMLElement {
    /* static _className = "";
     get className(){
         new ComponentNameNotDefinedError();
         return "";
     }*/
    constructor(componentProps) {
        try {
            super();
            this.firebase = firebase;
        }
        catch (e) {
            console.log(e.message);
            let error = e.stack.toString().substring(0, e.stack.toString().length);
            let classes = error.split("at new ").slice(1);
            classes.forEach((str, index, array) => {
                classes[index] = str.substring(0, str.indexOf(" "));
            });
            console.log(classes);
            new CustomComponentNotDefinedError(classes);
            super();
        }
    }
    static get observedAttributes() {
        if (Config.showObservedAttrNotDefined) {
            console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
                "Will use empty array ([])\n" +
                "See class PageCompnent for inspiration.");
        }
        //return ['disabled', 'open'];//example
        return [];
    }
    static defineComponent() {
        if (this.tagName && this.tagName.includes("-") && this.tagName != "default-tag") {
            customElements.define(this.tagName, this);
        }
        else {
            new BaseError("static property tagName not specified in class", this.name, true);
        }
    }
}
Component.tagName = "default-tag";
export class AbstractComponent extends Component {
    constructor(componentProps) {
        super(componentProps);
        this.componentConnected = false;
        this.componentProps = componentProps;
        this.initializeFromProps(componentProps);
    }
    initializeFromProps(componentProps) {
        if (!componentProps)
            return;
        for (const property in componentProps) {
            if (this.style[property] != undefined) { //Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            }
            else { //Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        if (!this.style.display) { //If not set
            this.style.display = "block";
        }
        if (componentProps.connectToParent) {
            let replace = false;
            if (componentProps.replaceParentContent) {
                replace = componentProps.replaceParentContent;
            }
            this.connectComponent(componentProps.connectToParent, componentProps.replaceParentContent);
        }
    }
    addListeners() {
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback() {
        new MethodNotImplementedError("connectedCallback", this, true);
    }
    disconnectedCallback() {
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }
    disconnectComponent() {
        this.parent.removeChild(this);
        this.componentConnected = false;
    }
    connectComponent(parent, replaceContent = false) {
        if (typeof parent == "string") {
            this.parent = document.getElementById(parent);
        }
        else {
            this.parent = parent;
        }
        if (!this.parent)
            return;
        if (replaceContent) {
            this.parent.innerHTML = "";
        }
        this.parent.appendChild(this);
        this.componentConnected = true;
        this.addListeners();
    }
}
