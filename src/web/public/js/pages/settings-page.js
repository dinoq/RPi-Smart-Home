import { FrameList, FrameListItem } from "../layouts/frame-list.js";
import { Firebase } from "../app/firebase.js";
import { BasePage } from "./base-page.js";
export class SettingsPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.roomsList = new FrameList();
        this.appendComponents(this.roomsList);
        Firebase.addDBListener("/rooms/", (data) => {
            let rooms = new Array();
            for (const roomDBName in data) {
                let room = data[roomDBName];
                room.dbName = roomDBName;
                rooms.push(room);
            }
            rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);
            console.log('rooms: ', rooms);
            this.roomsList.clearItems();
            for (let i = 0; i < rooms.length; i++) {
                let item = new FrameListItem(rooms[i].name, { up: (i != 0), down: (i != rooms.length - 1) });
                this.roomsList.addItems(item);
            }
        });
    }
}
SettingsPage.tagName = "settings-page";
