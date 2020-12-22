import { RoomCard } from "../../layouts/room-card.js";
import { Firebase } from "../../app/firebase.js";
import { BasePage } from "./base-page.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        Firebase.addDBListener("/room-names/", (data) => {
            this.innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                const roomCard = new RoomCard({ roomDBName: data[i] });
                this.appendComponents(roomCard);
            }
        });
    }
}
HomePage.tagName = "home-page";
