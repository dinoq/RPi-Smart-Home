import { RoomCard } from "../layouts/room-card.js";
import { Firebase } from "../app/firebase.js";
import { BasePage } from "./base-page.js";
import { Loader } from "../components/others/loader.js";
export class HomePage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        Loader.show();
        Firebase.addDBListener("rooms/", (data) => {
            Loader.hide();
            if (!data || Object.keys(data).length == 0) {
                this.roomsCards = new Array();
                this.roomsIndexes = new Array();
                this.innerHTML = `
                    <div  id="no-rooms-info-container">
                        <h1 id="no-rooms-info">V databázi nejsou žádné místnosti a zařízení. Můžete je přidat v nastavení systému (Menu -> Nastavení).</h1>
                    </div>
                `;
                return;
            }
            let rooms = new Array();
            for (const roomDBName in data) {
                let room = data[roomDBName];
                room.dbID = roomDBName;
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
                    const roomCard = new RoomCard({ dbID: rooms[i].dbID });
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
