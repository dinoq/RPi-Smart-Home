import { BasePage } from "./base-page.js";
export class SettingsPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        /*
                for (let i = 0; i < HomePage.DBRoomNames.length; i++) {
                    const roomCard = new RoomCard({ roomDBName: HomePage.DBRoomNames[i] });
                    this.appendComponents(roomCard);
                }*/
    }
}
SettingsPage.tagName = "home-page";
