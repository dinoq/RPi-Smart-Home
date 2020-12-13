import { RoomCard } from "../../layouts/room-card.js";
import { Config } from "../../utils/config.js";
import { componentProperties } from "../component.js";
import { LoginComponent } from "../forms/login-form.js";
import { BasePage } from "./base-page.js";

export class HomePage extends BasePage{
    static tagName = "home-page";

    loginForm: LoginComponent;    
    constructor(componentProps?: componentProperties){
        super(componentProps);
        
        for (let i = 0; i < 5; i++) {
            const roomCard = new RoomCard({tit:"AS"});
            this.appendComponents(roomCard);
        }
    }
    
}