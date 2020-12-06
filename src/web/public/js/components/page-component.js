import { ComponentNameNotDefinedError, CustomComponentNotDefinedError } from "../errors/component-errors.js";
import { MethodNotImplementedError } from "../errors/method-errors.js";
export class Component extends HTMLElement {
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
    static get observedAttributes() {
        console.warn("observedAttributes not defined for class: " + this.name + "!\n" +
            "Will use empty array ([])\n" +
            "See class PageCompnent for inspiration.");
        //return ['disabled', 'open'];//example
        return [];
    }
    get className() {
        new ComponentNameNotDefinedError();
        return "";
    }
}
Component._className = "";
export class AbstractComponent extends Component {
    constructor(componentProps) {
        super(componentProps);
        this.componentProps = componentProps;
        this.initialize(componentProps);
    }
    initialize(componentProps) {
        for (const property in componentProps) {
            if (this.style[property] != undefined) { //Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            }
            else { //Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        this.style.display = "block";
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
    }
    connectComponent(parent, replaceContent = true) {
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
        this.addListeners();
    }
}
