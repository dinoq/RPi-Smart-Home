import { RoomCard } from "../layouts/room-card.js";
import { Firebase } from "../app/firebase.js";
import { BasePage } from "./base-page.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        Firebase.addDBListener("/rooms/", (data) => {
            let rooms = new Array();
            for (const roomDBName in data) {
                let room = data[roomDBName];
                room.dbName = roomDBName;
                rooms.push(room);
            }
            rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);
            let roomOrderChanged = false;
            if (this.roomsIndexes && rooms.length == this.roomsIndexes.length) {
                for (let i = 0; i < rooms.length; i++) {
                    if (rooms[i].index != this.roomsIndexes[i])
                        roomOrderChanged = true;
                }
            }
            else
                roomOrderChanged = true;
            if (this.roomsIndexes == undefined)
                roomOrderChanged = true;
            if (roomOrderChanged) { //init room cards
                this.innerHTML = "";
                this.roomsCards = new Array();
                this.roomsIndexes = new Array();
                for (let i = 0; i < rooms.length; i++) {
                    const roomCard = new RoomCard({ roomDBName: rooms[i].dbName });
                    this.appendComponents(roomCard);
                    this.roomsCards.push(roomCard);
                    this.roomsIndexes.push(rooms[i].index);
                }
            }
            for (let i = 0; i < this.roomsCards.length; i++) {
                const roomCard = this.roomsCards[i];
                roomCard.updateCard(rooms[i]);
            }
        });
    }
}
HomePage.tagName = "home-page";
