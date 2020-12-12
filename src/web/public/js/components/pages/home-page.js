import { RoomCard } from "../../layouts/room-card.js";
import { BasePage } from "./base-page.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        for (let i = 0; i < 5; i++) {
            const roomCard = new RoomCard();
            this.appendComponents(roomCard);
        }
    }
}
HomePage.tagName = "home-page";
