import { FrameList, FrameListItem, FrameListTypes, ItemTypes } from "../layouts/frame-list.js";
import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { BaseComponent, IComponentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-form.js";
import { BasePage } from "./base-page.js";
import { Utils } from "../app/utils.js";
import { HorizontalStack } from "../layouts/horizontal-stack.js";
import { TabLayout } from "../layouts/tab-layout.js";
import { FrameDetail } from "../layouts/frame-detail.js";
import { YesNoCancelDialog } from "../components/dialogs/yes-no-cancel-dialog.js";
import { DialogResponses } from "../components/dialogs/base-dialog.js";

export class SettingsPage extends BasePage {
    static tagName = "settings-page";

    private rooms;
    private roomsList: RoomsList;
    private sensorsList: SensorsList;
    private devicesList: FrameList;
    private editedRoom: FrameListItem;
    private sensorsDevicesTabPanel: TabLayout;
    private saveBtn;
    private _readyToSave: boolean = false;
    private detail: FrameDetail;

    set readyToSave(val){
        if(!this._readyToSave){
            this.saveBtn.classList.add("blink");
            (<HTMLButtonElement>(<HorizontalStack>this.saveBtn).children[0]).style.fontWeight = "bold";
            this._readyToSave = true;
        }
    }
    get readyToSave(){
        return this._readyToSave;
    }
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);

        this.roomsList = new RoomsList(FrameListTypes.ROOMS);


        this.sensorsList = new SensorsList(FrameListTypes.SENSORS);
        
        this.saveBtn = new HorizontalStack({ innerHTML: `
            <button class="settings save-btn">Uložit</button>
        `, justifyContent: "center"});
        this.saveBtn.querySelector(".save-btn").addEventListener("click",()=>{
            console.log("SAVEEE");
        })
        
        this.devicesList = new SensorsList(FrameListTypes.DEVICES);
        
        this.sensorsDevicesTabPanel = new TabLayout([{
            title: "Snímače",
            container: this.sensorsList
        },{
            title: "Zařízení",
            container: this.devicesList
        }]);

        this.detail = new FrameDetail();
        
        this.appendComponents([this.saveBtn, this.roomsList, this.sensorsDevicesTabPanel, this.detail]);


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
        this.roomsList.addItems(this.roomsList.addItemBtn);
        for (let i = 0; i < rooms.length; i++) {
            let bottom = (i!=(rooms.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, rooms[i], {up: (i!=0), down: (i!=(rooms.length-1))});
            this.roomsList.addItems(item);
        }
    }

    /**
     * Find out list, which is parent of item param
     * @param item Item to which we are searching parent FrameList
     */
    getItemsList(item: FrameListItem){
        let lists = [this.roomsList, this.sensorsList,this.devicesList];
        let list;
        lists.forEach((l)=>{
            let tmpIndex = Array.from(l.childNodes).indexOf(item);
            if(tmpIndex != -1){
                list = l;
            }
        })
        return list;
    }

    getTitleForEditingFromItem(item: FrameListItem, name: string){
        let list = this.getItemsList(item);
        let title = 'Editujete ';
        switch(list.type){
            case FrameListTypes.BASE:

            break;
            case FrameListTypes.SENSORS:
                title += 'senzor ';
            break;
            case FrameListTypes.DEVICES:
                title += 'zařízení ';
            break;
            case FrameListTypes.ROOMS:
                title += 'místnost ';
            break;
        }

        title += '"' + name + '"';
        return title;
    }
    /**
     * Event hadler for click on any FrameListItem
     * @param event Event
     * @param item Clicked Item
     * @param clickedElem Textual description of clicked element in item (like delete for delete button). Is undefined in case of click outside of particular elements (buttons)
     */
    itemClicked = async (event, item:FrameListItem, clickedElem?: string)=> {
        console.log('item: ', item.dbCopy);
        console.log("Save dialog show?", this.readyToSave);

        let dialog = new YesNoCancelDialog("Uložit změny?");
        if(this.readyToSave){
            let ans = await dialog.show();
            if(ans == DialogResponses.YES){

            }else if(ans == DialogResponses.NO){

            }else{
                return;
            }
        }

        console.log("pokracuji");
        let parentList:any = this.getItemsList(item);

        if(clickedElem == undefined){
            Array.from(parentList.childNodes).forEach(listItem => {
                (<FrameListItem>listItem).classList.remove("active");
            });
            item.classList.add("active");
            if(parentList.type==FrameListTypes.ROOMS){ // We want to initialize sensors and devices only when click on room, not on sensor or device
                this.editedRoom = item;
                this.initSensorsList(item);
                this.initDevicesList(item);
            }
            this.initDetail(item, parentList.type);
        }else{
            this.readyToSave = true;

            let itemIndex = Array.from(parentList.childNodes).indexOf(item);            
            let oldIndex = item.dbCopy.index;

            if(clickedElem == "up" || clickedElem == "down"){
                let children = Array.from(parentList.childNodes);
                let otherIndex = (clickedElem == "up")? (itemIndex-1) : (itemIndex+1);
                let otherItem = (<FrameListItem>(children[otherIndex]));
                let newIndex = otherItem.dbCopy.index;
                item.dbCopy.index = newIndex;
                otherItem.dbCopy.index = oldIndex;
                
                if(clickedElem == "up"){
                    parentList.insertBefore(item,otherItem);
                }else if(clickedElem == "down"){
                    parentList.insertBefore(otherItem, item);
                }
                
                let itemPath;
                let otherItemPath;
                if(parentList instanceof RoomsList){
                    itemPath = "rooms/"+item.dbCopy.dbName;
                    otherItemPath = "rooms/"+otherItem.dbCopy.dbName;
                }else{
                    itemPath = item.dbCopy.path;
                    otherItemPath = otherItem.dbCopy.path;
                }
                Firebase.updateDBData(itemPath, {index: newIndex})
                Firebase.updateDBData(otherItemPath, {index: oldIndex})

                parentList.updatedOrderHandler();
            }
            
        }
    }

    initSensorsList=(item)=>{
        console.log("activated for", item.dbCopy);
        
        let ordered = RoomCard.getOrderedINOUT(item.dbCopy.devices, item.dbCopy.dbName);
        let orderedIN = ordered.orderedIN;
        
        this.sensorsList.clearItems();
        this.sensorsList.addItems(this.sensorsList.addItemBtn);
        for (let i = 0; i < orderedIN.length; i++) {
            let bottom = (i!=(orderedIN.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, orderedIN[i], {up: (i!=0), down: (i!=(orderedIN.length-1))});
            this.sensorsList.addItems(item);
        }
        if(!orderedIN || !orderedIN.length){
            let list = this.sensorsList;
            list.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Nenalezeny žádné senzory pro zvolenou místnost. Zkuste nějaké přidat");
            list.addItems(list.defaultItem);
        }
        
    }

    initDevicesList=(item)=>{
        
        let ordered = RoomCard.getOrderedINOUT(item.dbCopy.devices, item.dbCopy.dbName);
        let orderedOUT = ordered.orderedOUT;
        
        this.devicesList.clearItems();
        this.devicesList.addItems(this.devicesList.addItemBtn);
        for (let i = 0; i < orderedOUT.length; i++) {
            let bottom = (i!=(orderedOUT.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, orderedOUT[i], {up: (i!=0), down: (i!=(orderedOUT.length-1))});
            this.devicesList.addItems(item);
        }

        if(!orderedOUT || !orderedOUT.length){
            let list = this.devicesList;
            list.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Nenalezeny žádná zařízení pro zvolenou místnost. Zkuste nějaké přidat");
            list.addItems(list.defaultItem);
        }
    }

    initDetail(item, parenListType: FrameListTypes){
        let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
        let values;
        if(parenListType == FrameListTypes.ROOMS){
            values = [item.dbCopy.name, item.dbCopy.img.src, item.dbCopy.img.offset];
        }
        this.detail.updateDetail(title, parenListType, (event)=>{this.readyToSave = true}, values);
        
    }

}

export class RoomsList extends FrameList{
    static tagName = "rooms-list";
    
    constructor(type: FrameListTypes, componentProps?: IComponentProperties) {
        super(type, componentProps);
        
        this.defaultItem = new FrameListItem();
        this.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Vyčkejte, načítají se data z databáze");
        this.addItems(this.defaultItem);
    }
    

    itemClicked =(event, item:FrameListItem, clickedElem?: string)=> {
        return;
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
                /*item.updateArrows(children.indexOf(item),children.length-1, false);
                otherItem.updateArrows(children.indexOf(otherItem),children.length-1, true);*/
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
                /*item.updateArrows(children.indexOf(item),children.length-1, true);
                otherItem.updateArrows(children.indexOf(otherItem),children.length-1, false);*/
                item.dbCopy.index = newIndex;
                otherItem.dbCopy.index = oldIndex;

                this.insertBefore(otherItem, item);
            }
        }

    }

}

export class SensorsList extends FrameList{
    static tagName = "sensors-list";
    
    constructor(type: FrameListTypes, componentProps?: IComponentProperties) {
        super(type, componentProps);

        this.defaultItem = new FrameListItem();
        this.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Vyberte místnost");
        this.addItems(this.defaultItem);
    }
    
    initListFromDB(db: any[]) {
        this.clearItems();
        for (let i = 0; i < db.length; i++) {
            let bottom = (i!=(db.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, db[i], {up: (i!=0), down: (i!=(db.length-1))});
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