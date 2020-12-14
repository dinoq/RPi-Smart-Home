import { RoomCard } from "../../layouts/room-card.js";
import { Firebase } from "../../utils/firebase.js";
import { BasePage } from "./base-page.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        for (let i = 0; i < HomePage.roomNames.length; i++) {
            const roomCard = new RoomCard({ roomName: HomePage.roomNames[i] });
            this.appendComponents(roomCard);
        }
        Firebase.addDBListener("buildings/aaaa/rooms/kuchyn", (data) => {
            console.log('data: ', data);
        });
    }
}
HomePage.tagName = "home-page";
HomePage.roomNames = [
    "Obyvaci pokoooj",
    "kuchyn",
    "pokojík"
];
