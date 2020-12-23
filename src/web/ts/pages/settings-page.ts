import { FrameList, FrameListItem } from "../layouts/frame-list.js";
import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { BaseComponent, IComponentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-form.js";
import { BasePage } from "./base-page.js";
import { Utils } from "../app/utils.js";
import { HorizontalStack } from "../layouts/horizontal-stack.js";
import { TabLayout } from "../layouts/tab-layout.js";

export class SettingsPage extends BasePage {
    static tagName = "settings-page";

    private rooms;
    private roomsList: RoomsList;
    private sensorsList: SensorsList;
    private devicesList: FrameList;
    private editedRoom: FrameListItem;
    private tabPanel: TabLayout;
    private saveBtn;
    private _readyToSave: boolean = false;
    set readyToSave(val){
        if(!this._readyToSave){
            this.saveBtn.classList.add("blink");
            this._readyToSave = true;
        }
    }
    get readyToSave(){
        return this._readyToSave;
    }
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);

        this.roomsList = new RoomsList();


        this.sensorsList = new SensorsList();
        this.sensorsList.style.borderTop = "2px solid black";
        this.saveBtn = new HorizontalStack({ innerHTML: `
            <button class="save-btn">Uložit</button>
        `, justifyContent: "center"});
        this.saveBtn.querySelector(".save-btn").addEventListener("click",()=>{
            console.log("SAVEEE");
        })
        
        this.devicesList = new FrameList();
        
        this.tabPanel = new TabLayout([{
            title: "Snímače",
            container: this.sensorsList
        },{
            title: "Zařízení",
            container: this.devicesList
        }]);
        this.appendComponents([this.roomsList, this.tabPanel, this.saveBtn]);


        Firebase.getDBData("/rooms/", (data)=>{
            let rooms = new Array();
            for(const roomDBName in data){
                let room = data[roomDBName];
                room.dbName = roomDBName;
                rooms.push(room);
            }
            
            rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);
            this.rooms = rooms;
            this.initRoomsList(rooms);
            
        })


    }
    initRoomsList(rooms: any[]) {
        this.roomsList.clearItems();
        for (let i = 0; i < rooms.length; i++) {
            //let bottom = (i!=(db.length-1))? "1px solid grey" : "none";
            let bottom =  "1px solid grey";
            let item = new FrameListItem(rooms[i], {up: (i!=0), down: (i!=(rooms.length-1))}, this.itemClicked, {borderBottom: bottom});
            this.roomsList.addItems(item);
        }
    }

    
    itemClicked =(event, item:FrameListItem, clickedElem?: string)=> {
        if(clickedElem == undefined){
            Array.from(this.roomsList.childNodes).forEach(listItem => {
                (<FrameListItem>listItem).classList.remove("active");
            });
            item.classList.add("active");
            this.initSensorsList(item);
        }else{
            this.readyToSave = true;
        }
    }

    initSensorsList=(item)=>{
        if(!item)
            return;
        console.log("activated for", item.dbCopy);
        this.editedRoom = item;
        
        let ordered = RoomCard.getOrderedINOUT(item.dbCopy.devices, item.dbCopy.dbName);
        let orderedIN = ordered.orderedIN;
        
        this.sensorsList.clearItems();
        for (let i = 0; i < orderedIN.length; i++) {
            let bottom = (i!=(orderedIN.length-1))? "1px solid grey" : "none";
            let item = new FrameListItem(orderedIN[i], {up: (i!=0), down: (i!=(orderedIN.length-1))}, this.itemClicked, {borderBottom: bottom});
            this.sensorsList.addItems(item);
        }
        
    }

}

export class RoomsList extends FrameList{
    static tagName = "rooms-list";
    
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
    }
    

    itemClicked =(event, item:FrameListItem, clickedElem?: string)=> {
        console.log('item: ', item.dbCopy);
        if(clickedElem == undefined){
            Array.from(this.childNodes).forEach(listItem => {
                (<FrameListItem>listItem).classList.remove("active");
            });
            item.classList.add("active");
            //this.roomActiveCallback(item);
        }else{
            let itemIndex = Array.from(this.childNodes).indexOf(item);
            let oldIndex = item.dbCopy.index;
            console.log('item.dbRoom: ', item.dbCopy);
            if(clickedElem == "up"){
                let children = Array.from(this.childNodes);
                let otherItem = (<FrameListItem>(children[itemIndex-1]));
                let newIndex = otherItem.dbCopy.index;
                item.updateArrows(children.indexOf(item),children.length-1, false);
                otherItem.updateArrows(children.indexOf(otherItem),children.length-1, true);
                item.dbCopy.index = newIndex;
                otherItem.dbCopy.index = oldIndex;

                this.insertBefore(item,otherItem);

                //Firebase.updateDBData("rooms/"+item.dbCopy.dbName, {index: newIndex})
                //Firebase.updateDBData("rooms/"+otherItem.dbCopy.dbName, {index: oldIndex})
            }
            if(clickedElem == "down"){
                let children = Array.from(this.childNodes);
                let otherItem = (<FrameListItem>(children[itemIndex+1]));
                let newIndex = otherItem.dbCopy.index;
                item.updateArrows(children.indexOf(item),children.length-1, true);
                otherItem.updateArrows(children.indexOf(otherItem),children.length-1, false);
                item.dbCopy.index = newIndex;
                otherItem.dbCopy.index = oldIndex;

                this.insertBefore(otherItem, item);
            }
        }

    }

}

export class SensorsList extends FrameList{
    static tagName = "sensors-list";
    
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
    }
    
    initListFromDB(db: any[]) {
        this.clearItems();
        for (let i = 0; i < db.length; i++) {
            let bottom = (i!=(db.length-1))? "1px solid grey" : "none";
            let item = new FrameListItem(db[i], {up: (i!=0), down: (i!=(db.length-1))}, this.itemClicked, {borderBottom: bottom});
            this.addItems(item);
        }
    }

    itemClicked =(event, item:FrameListItem, clickedElem?: string)=> {
        console.log("index kliknuteho:",item.dbCopy.path,item.dbCopy.index);
        if(clickedElem == undefined){
            Array.from(this.childNodes).forEach(listItem => {
                (<FrameListItem>listItem).classList.remove("active");
            });
            item.classList.add("active");
        }else{
            let itemIndex = Array.from(this.childNodes).indexOf(item);
            let oldIndex = item.dbCopy.index;
            console.log('item.dbRoom: ', item.dbCopy);
            if(clickedElem == "up"){
                let otherItem = (<FrameListItem>(Array.from(this.childNodes)[itemIndex-1]));
                let newIndex = otherItem.dbCopy.index;
                Firebase.updateDBData(item.dbCopy.path, {index: newIndex})
                Firebase.updateDBData(otherItem.dbCopy.path, {index: oldIndex})
            }
            if(clickedElem == "down"){
                let otherItem = (<FrameListItem>(Array.from(this.childNodes)[itemIndex+1]));
                let newIndex = otherItem.dbCopy.index;
                Firebase.updateDBData(item.dbCopy.path, {index: newIndex})
                Firebase.updateDBData(otherItem.dbCopy.path, {index: oldIndex})
            }
        }

    }

}