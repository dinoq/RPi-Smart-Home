import { Config } from "../../app/config.js";
import { IComponentProperties } from "../component.js";
import { BaseDialog, DialogResponses } from "./base-dialog.js";

export class ChoiceDialog extends BaseDialog {
    static tagName = "choice-dialog";
    
    private _choices: string[];
    constructor(text: string, choices: string[], componentProps?: IComponentProperties){
        super(componentProps);

        this._choices = choices;
        let content = document.createElement("div");
        content.innerHTML = `        
            <div class="dialog">
                <div class="message-box">
                    ${text} 
                </div>
                <div class="dialog-btn-group">
                </div>
            </div>
        `;

        this.appendChild(this.overlayContainer);
        this.appendChild(content);

        let btns = "";
        let classes;
        if(choices.length == 1){
            classes = new Array("btn-primary");
        }else if(choices.length == 2){
            classes = new Array("btn-secondary", "btn-primary");
        }else if(choices.length == 3){
            classes = new Array("btn-primary", "btn-secondary", "btn-light");
        }else{            
            classes.fill("btn-secondary", 0, choices.length);
        }
        for(let i = 0; i < choices.length; i++) {
            btns += `            
                <div class="btn ${classes[i]}">
                    ${choices[i]}
                </div>
            `
        }
        this.querySelector(".dialog-btn-group").innerHTML = btns;
    }

    async show(){
        document.body.appendChild(this);
        (<HTMLElement>this.overlayContainer.querySelector(".overlay")).classList.add("light");

        return new Promise( (resolve,reject) => {
            for(let i = 0; i < this._choices.length; i++) {
                this.querySelectorAll(".btn")[i].addEventListener('click', ()=>{       
                    resolve(this._choices[i]);   
                    this.remove();                
                })
            }
        });
    }
}

