import { RoomCard } from "../../layouts/room-card.js";
import { Config } from "../../app/config.js";
import { Firebase } from "../../app/firebase.js";
import { componentProperties } from "../component.js";
import { LoginComponent } from "../forms/login-form.js";
import { BasePage } from "./base-page.js";

export class HomePage extends BasePage {
    static tagName = "home-page";

    loginForm: LoginComponent;
    constructor(componentProps?: componentProperties) {
        super(componentProps);
        
        Firebase.addDBListener("/room-names/", (data)=>{
            this.innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                const roomCard = new RoomCard({ roomDBName: data[i] });
                this.appendComponents(roomCard);
            }
        })

    }

}