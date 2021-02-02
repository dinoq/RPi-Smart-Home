import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { IComponentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-form.js";
import { BasePage } from "./base-page.js";
import { PageManager } from "../app/page-manager.js";
import { Loader } from "../components/others/loader.js";

export class HomePage extends BasePage {
    static tagName = "home-page";

    roomsIndexes: Array<any>;
    roomsCards: Array<RoomCard>;
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);

        Loader.show();
        Firebase.addDBListener("/rooms/", (data)=>{      
            Loader.hide();      
            let rooms = new Array();
            for(const roomDBName in data){
                let room = data[roomDBName];
                room.dbID = roomDBName;
                rooms.push(room);
            }

            rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);

            let roomOrderChanged = false;
            if(this.roomsIndexes && rooms.length == this.roomsIndexes.length){
                for (let i = 0; i < rooms.length; i++) {
                    if(rooms[i].index != this.roomsIndexes[i])
                        roomOrderChanged = true;
                }    
            }else
                roomOrderChanged = true;
            if(this.roomsIndexes == undefined)
                roomOrderChanged = true;

            if(roomOrderChanged){//init room cards
                this.innerHTML = "";
                this.roomsCards = new Array();
                this.roomsIndexes = new Array();
                for (let i = 0; i < rooms.length; i++) {
                    const roomCard = new RoomCard({ dbID: rooms[i].dbID });
                    this.appendComponents(roomCard);
                    this.roomsCards.push(roomCard);
                    this.roomsIndexes.push(rooms[i].index)
                }
            }
            
            for (let i = 0; i < this.roomsCards.length ; i++) {
                const roomCard = this.roomsCards[i];
                roomCard.updateCard(rooms[i]);
            }
            
        })

    }

}