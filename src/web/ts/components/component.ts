import { BaseError } from "../errors/base-error.js";
import { ComponentNameNotDefinedError, CustomComponentNotDefinedError } from "../errors/component-errors.js";
import { MethodNotImplementedError } from "../errors/method-errors.js";
import { Config } from "../app/config.js";
import { Utils } from "../app/utils.js";
import { LoginComponent } from "./forms/login-form.js";


export class Component extends HTMLElement {
    protected firebase: any;
    protected parent: HTMLElement;
    public observedAttributes;
    static get observedAttributes() {
        if (Config.showObservedAttrNotDefined) {
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

    constructor(componentProps?: IComponentProperties) {
        try {
            super();
        }
        catch (e: any) {
            console.log(e.message);
            let error = e.stack.toString().substring(0, e.stack.toString().length);
            let classes = error.split("at new ").slice(1);
            classes.forEach((str, index, array) => {
                classes[index] = str.substring(0, str.indexOf(" "));
            })
            console.log(classes);
            new CustomComponentNotDefinedError(classes);
            super();
        }

    }

    static tagName = "default-tag";
    static defineComponent() {
        if (this.tagName && this.tagName.includes("-") && this.tagName != "default-tag") {
            customElements.define(this.tagName, <CustomElementConstructor>this);
        } else {
            new BaseError("static property tagName not specified in class", this.name, true);
        }
    }
}
export abstract class AbstractComponent extends Component {
    componentProps: IComponentProperties;
    componentConnected: boolean = false;

    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
        this.componentProps = componentProps;
        this.initializeFromProps(componentProps);
    }



    initializeFromProps(componentProps?: IComponentProperties): void {
        if (!this.style.display) { //If not set
            this.style.display = "block";
        }
        if (!componentProps)
            return;
        for (const property in componentProps) {
            if (this.style[property] != undefined) {//Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            } else {//Is not CSS property, thus is meant to be layout property
                //console.log(property+" is not CSS property!");
            }
        }
        if (componentProps.connectToParent) {
            AbstractComponent.connectComponent(componentProps.connectToParent, this);
        }
        if (componentProps.innerText)
            this.innerText = componentProps.innerText;
        if (componentProps.innerHTML)
            this.innerHTML = componentProps.innerHTML;
        
        if(componentProps.classList){
            if(Array.isArray(componentProps.classList)){
                componentProps.classList.forEach((className)=>{
                    this.classList.add(className);
                })
            }else{
                this.classList.add(componentProps.classList);
            }
        }

        if(componentProps.componentsToConnect){ // Connect components
            if(Array.isArray(componentProps.componentsToConnect)){
                componentProps.componentsToConnect.forEach( component=>{
                    if(component instanceof AbstractComponent)
                        this.appendComponents(component);
                    else
                        this.appendDOMComponents(component);                    
                })
            }else{
                if(componentProps.componentsToConnect instanceof AbstractComponent)
                    this.appendComponents(componentProps.componentsToConnect);
                else
                    this.appendDOMComponents(componentProps.componentsToConnect);
            }
        }
    }


    reinitializeFromProps(props: IComponentProperties) {
        let mergedProperties = Utils.mergeObjects(this.componentProps, props);
        this.componentProps = mergedProperties;
        this.initializeFromProps(mergedProperties);
    }

    addListeners(...params): void {
        new MethodNotImplementedError("addListeners", this, true);
    }
    connectedCallback(): void {
        new MethodNotImplementedError("connectedCallback", this, true);
    }
    disconnectedCallback(): void {
        new MethodNotImplementedError("disconnectedCallback", this, true);
    }
    attributeChangedCallback(attrName, oldVal, newVal): void {
        new MethodNotImplementedError("attributeChangedCallback", this, true);
    }

    disconnectComponent() {
        try{
            this.parent.removeChild(this);
        }finally{
            this.componentConnected = false;
        }
    }

    // Appends one or more custom element (successor of AbstractComponent) to this. For appending pre-defined DOM elements (like div, table etc.) use method appendDOMComponents()
    appendComponents(components: AbstractComponent | AbstractComponent[], position: number = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(this, component, position);
            });
        } else {
            AbstractComponent.connectComponent(this, components, position);
        }
    }

    // Appends one or more HTMLElement to this. For appending custom elements use method appendComponents()
    appendDOMComponents(components: HTMLElement | HTMLElement[], position: number = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(this, component, position);
            });
        } else {
            AbstractComponent.connectComponent(this, components, position);
        }
    }

    static appendComponentsToDOMElements(parent: HTMLElement, components: AbstractComponent | AbstractComponent[] | HTMLElement | HTMLElement[], position: number = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(parent, component, position);
            });
        } else {
            AbstractComponent.connectComponent(parent, components, position);
        }
    }

    private static connectComponent(parent: string | HTMLElement, componentToConnect: AbstractComponent | HTMLElement, position: number = -1) {
        let parentComponent: HTMLElement;
        if (typeof parent == "string") {
            parentComponent = document.getElementById(parent);
        } else {
            parentComponent = parent;
        }
        if (!parentComponent)
            return;

        if(position == -1)
            parentComponent.appendChild(componentToConnect);
        else
            parentComponent.insertBefore(componentToConnect, parentComponent.children[position]);
        if (componentToConnect instanceof AbstractComponent) {
            componentToConnect.parent = parentComponent;
            componentToConnect.componentConnected = true;
            componentToConnect.addListeners();
        }
    }



}

export class BaseComponent extends AbstractComponent {
    static tagName = "base-component";

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
    }

}

export interface IComponentProperties extends Partial<CSSStyleDeclaration> {
    // CSS props
    /*x?: string,
    y?: string,
    width?: string,
    height?: string,
    backgroundColor?: string,
    display?: string,
    position?: string,
    left?: string,
    right?: string,
    top?: string,
    bottom?: string,
    transition?: string,
    "z-index"?: string,
    "flex-direction"?: string,
    "justify-content"?: string,
    "padding"?: string,*/

    // Component props
    title?: string,
    innerHTML?: string,
    innerText?: string,
    resizable?: boolean,
    connectToParent?: string | HTMLElement,
    classList?: string | string[],
    componentsToConnect?: HTMLElement | AbstractComponent | HTMLElement[] | AbstractComponent[]
}
