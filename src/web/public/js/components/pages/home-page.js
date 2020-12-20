import { RoomCard } from "../../layouts/room-card.js";
import { BasePage } from "./base-page.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        for (let i = 0; i < HomePage.DBRoomNames.length; i++) {
            const roomCard = new RoomCard({ roomDBName: HomePage.DBRoomNames[i] });
            this.appendComponents(roomCard);
        }
    }
}
HomePage.tagName = "home-page";
HomePage.DBRoomNames = [
    "Obyvaci pokoooj",
    "kuchyn",
    "pokojík"
];
