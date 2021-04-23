import { BaseDialogError } from "../errors/base-errors.js";
import { CustomComponentNotDefinedError } from "../errors/component-errors.js";
import { MethodNotImplementedError } from "../errors/method-errors.js";
import { Config } from "../app/config.js";
import { Utils } from "../app/utils.js";
export class Component extends HTMLElement {
    /* static _className = "";
     get className(){
         new ComponentNameNotDefinedError();
         return "";
     }*/
    constructor(componentProps) {
        try {
            super();
        }
        catch (e) {
            console.log(e.message);
            let error = e.stack.toString().substring(0, e.stack.toString().length);
            let classes = error.split("at new ").slice(1);
            classes.forEach((str, index, array) => {
                classes[index] = str.substring(0, str.indexOf(" "));
            });
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
            try {
                customElements.define(this.tagName, this);
            }
            catch (error) {
                new BaseDialogError("Chyba při definici vlastní komponenty.\n Popis původní chyby:\n " + error.message, this.name, true);
            }
        }
        else {
            new BaseDialogError("Statická vlastnost tagName nespecifikována pro " + this.name, this.name, true);
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
        if (!this.style.display) { //If not set
            this.style.display = "block";
        }
        if (!componentProps)
            return;
        for (const property in componentProps) {
            if (this.style[property] != undefined) { //Is CSS pproperty, thus asign it!
                this.style[property] = componentProps[property];
            }
        }
        if (componentProps.connectToParent) {
            AbstractComponent.connectComponent(componentProps.connectToParent, this);
        }
        if (componentProps.innerText)
            this.innerText = componentProps.innerText;
        if (componentProps.innerHTML)
            this.innerHTML = componentProps.innerHTML;
        if (componentProps.classList) {
            if (Array.isArray(componentProps.classList)) {
                componentProps.classList.forEach((className) => {
                    this.classList.add(className);
                });
            }
            else {
                this.classList.add(componentProps.classList);
            }
        }
        if (componentProps.componentsToConnect) { // Connect components
            if (Array.isArray(componentProps.componentsToConnect)) {
                componentProps.componentsToConnect.forEach(component => {
                    if (component instanceof AbstractComponent)
                        this.appendComponents(component);
                    else
                        this.appendDOMComponents(component);
                });
            }
            else {
                if (componentProps.componentsToConnect instanceof AbstractComponent)
                    this.appendComponents(componentProps.componentsToConnect);
                else
                    this.appendDOMComponents(componentProps.componentsToConnect);
            }
        }
    }
    reinitializeFromProps(props) {
        let mergedProperties = Utils.mergeObjects(this.componentProps, props);
        this.componentProps = mergedProperties;
        this.initializeFromProps(mergedProperties);
    }
    addListeners(...params) {
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
        try {
            this.parent.removeChild(this);
        }
        catch (err) {
        }
        finally {
            this.componentConnected = false;
        }
    }
    // Appends one or more custom element (successor of AbstractComponent) to this. For appending pre-defined DOM elements (like div, table etc.) use method appendDOMComponents()
    appendComponents(components, position = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(this, component, position);
            });
        }
        else {
            AbstractComponent.connectComponent(this, components, position);
        }
    }
    // Appends one or more HTMLElement to this. For appending custom elements use method appendComponents()
    appendDOMComponents(components, position = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(this, component, position);
            });
        }
        else {
            AbstractComponent.connectComponent(this, components, position);
        }
    }
    static appendComponentsToDOMElements(parent, components, position = -1) {
        if (Array.isArray(components)) {
            components.forEach(component => {
                AbstractComponent.connectComponent(parent, component, position);
            });
        }
        else {
            AbstractComponent.connectComponent(parent, components, position);
        }
    }
    static connectComponent(parent, componentToConnect, position = -1) {
        let parentComponent;
        if (typeof parent == "string") {
            parentComponent = document.getElementById(parent);
        }
        else {
            parentComponent = parent;
        }
        if (!parentComponent)
            return;
        if (position == -1)
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
    constructor(layoutProps) {
        super(layoutProps);
    }
}
BaseComponent.tagName = "base-component";
