import { RoomCard } from "../../layouts/room-card.js";
import { Config } from "../../utils/config.js";
import { Firebase } from "../../utils/firebase.js";
import { componentProperties } from "../component.js";
import { LoginComponent } from "../forms/login-form.js";
import { BasePage } from "./base-page.js";

export class HomePage extends BasePage {
    static tagName = "home-page";

    loginForm: LoginComponent;
    constructor(componentProps?: componentProperties) {
        super(componentProps);

        for (let i = 0; i < HomePage.roomNames.length; i++) {
            const roomCard = new RoomCard({ roomName: HomePage.roomNames[i] });
            this.appendComponents(roomCard);
        }
        Firebase.addDBListener("buildings/aaaa/rooms/kuchyn", (data) =>{
            console.log('data: ', data);

        })
    }

    static roomNames = [
        "Obyvaci pokoooj",
        "kuchyn",
        "pokojík"
    ]
}