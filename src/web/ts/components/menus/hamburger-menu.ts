import { Config } from "../../utils/config.js";
import { AbstractComponent, componentProperties } from "../page-component.js";
import { BaseMenu } from "./base-menu.js";

export class HamburgerMenu extends BaseMenu{
    private hamburgerIcon: HTMLImageElement;
    constructor(componentProps: componentProperties){
        super(componentProps);
        
        let props: componentProperties = {
            height: "0px",       
            position: "absolute",   
            transition: "all 1s",
            left: "0px",
        }
        this.initializeFromProps(props);
    }

    
    addMenuItem(item: AbstractComponent){
        super.addMenuItem(item);
        //this.style.display = "block";
    }
    
    hide(immediately: boolean){
        if(immediately){
            
        }
        this.style.left = -this.itemsContainer.clientWidth+"px";
    }
    addListeners(): void{
        window.addEventListener("resize",this.resize);
    }

    resize(){
        console.log(Config.getWindowHeight());
    }
    
}