import { FrameList, FrameListItem } from "../layouts/frame-list.js";
import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { BaseComponent, componentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-form.js";
import { BasePage } from "./base-page.js";

export class SettingsPage extends BasePage {
    static tagName = "settings-page";

    private roomsList: FrameList;
    loginForm: LoginComponent;
    constructor(componentProps?: componentProperties) {
        super(componentProps);

        this.roomsList = new FrameList();
        this.appendComponents(this.roomsList);

        Firebase.addDBListener("/rooms/", (data)=>{
            let rooms = new Array();
            for(const roomDBName in data){
                let room = data[roomDBName];
                room.dbName = roomDBName;
                rooms.push(room);
            }
            
            rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);
            console.log('rooms: ', rooms);
            this.roomsList.clearItems();
            for (let i = 0; i < rooms.length; i++) {
                let item = new FrameListItem(rooms[i].name, {up: (i!=0), down: (i!=rooms.length-1)});
                this.roomsList.addItems(item);
            }
        })


    }

}