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
import { EventManager } from "../app/event-manager.js";
import { URLManager } from "../app/url-manager.js";

export class SettingsPage extends BasePage {
    static tagName = "settings-page";

    private roomsList: FrameList;
    private sensorsList: FrameList;
    private devicesList: FrameList;
    private sensorsDevicesTabPanel: TabLayout;
    private saveBtn;
    private _readyToSave: boolean = false;
    private detail: FrameDetail;
    private itemInDetail: {item: any, parentListType: FrameListTypes};
    rooms: any[];
    mainTabPanel: TabLayout;
    

    set readyToSave(val){
        if(val){
            this.saveBtn.classList.add("blink");
            (<HTMLButtonElement>(<HorizontalStack>this.saveBtn).children[0]).style.fontWeight = "bold";
        }else{
            this.saveBtn.classList.remove("blink");
            (<HTMLButtonElement>(<HorizontalStack>this.saveBtn).children[0]).style.fontWeight = "normal";
        }
        this._readyToSave = val;
        EventManager.blocked = val;
    }
    get readyToSave(){
        return this._readyToSave;
    }
    constructor(componentProps?: IComponentProperties) {
        super(componentProps);

        this.roomsList = new FrameList(FrameListTypes.ROOMS);
        this.roomsList.initDefaultItem(ItemTypes.TEXT_ONLY, "Vyčkejte, načítají se data z databáze");
        this.roomsList.style.borderRadius = "0 10px 10px 10px";

        this.sensorsList = new FrameList(FrameListTypes.SENSORS);
        this.sensorsList.initDefaultItem(ItemTypes.TEXT_ONLY, "Vyberte místnost");

        this.saveBtn = new HorizontalStack({ innerHTML: `
            <button class="settings save-btn">Uložit</button>
        `, justifyContent: "center"});
        this.saveBtn.querySelector(".save-btn").addEventListener("click", this.saveChanges)
        
        this.devicesList = new FrameList(FrameListTypes.DEVICES);
        this.devicesList.initDefaultItem(ItemTypes.TEXT_ONLY, "Vyberte místnost");
        
        this.sensorsDevicesTabPanel = new TabLayout([{
            title: "Snímače",
            container: this.sensorsList
        },{
            title: "Zařízení",
            container: this.devicesList
        }]);

        this.detail = new FrameDetail();
        
        let firstTab = new BaseComponent();

        firstTab.appendComponents([this.saveBtn, this.roomsList, this.sensorsDevicesTabPanel, this.detail]);

        this.mainTabPanel = new TabLayout([{
            title: "Místnosti",
            container: firstTab
        }], { height: "100%" });

        this.appendComponents(this.mainTabPanel);

        this.initPageFromDB();

        document.addEventListener("click", async (e)=>{
            let path = (<any>e).path.map((element)=>{
                return (element.localName)? element.localName : "";
            })
            if(path.includes("menu-icon") || path.includes("menu-item")){
                await this.showSaveDialog();
            }
        });

    }

    initPageFromDB(){        
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

    saveChanges = (event) =>{
        if(this.itemInDetail.parentListType == FrameListTypes.ROOMS) {
            let name = (<HTMLInputElement>document.getElementById("room-name")).value;
            let imgSrc = (<HTMLInputElement>document.getElementById("img-src")).value;
            let imgOffset = parseInt((<HTMLInputElement>document.getElementById("img-offset")).value);
            imgOffset = (isNaN(imgOffset))? 0 : imgOffset;
            let itemToUpdate = {name: name, img: {src: imgSrc, offset:imgOffset}}
            let path = "rooms/" + this.itemInDetail.item.dbCopy.dbName;
            Firebase.updateDBData(path, itemToUpdate);
            this.initPageFromDB();
            this.detail.initialize();
            this.sensorsList.initialize();
            this.devicesList.initialize();
            
        }
        this.readyToSave = false;
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
        this.roomsList.updatedOrderHandler();
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
     * Show Save dialog and call events to unblock EventManager (other classes can use it to know, whether they can handle events, lets see Hamb)
     */
    showSaveDialog = async ()=>{        
        let dialog = new YesNoCancelDialog("V detailu máte rozpracované změny. <br>Uložit změny?");
        if(this.readyToSave){
            let ans = await dialog.show();
            if(ans == DialogResponses.YES){
                this.saveChanges(null);
            }else if(ans == DialogResponses.NO){
                this.initDetail();
                this.readyToSave = false;
            }else{
                EventManager.dispatchEvent("cancelEvents");
                return true;
            }
        }
        EventManager.dispatchEvent("unblocked");
        return false;
    }
    /**
     * Event hadler for click on any FrameListItem
     * @param event Event
     * @param item Clicked Item
     * @param clickedElem Textual description of clicked element in item (like delete for delete button). Is undefined in case of click outside of particular elements (buttons)
     */
    itemClicked = async (event, item:FrameListItem, clickedElem?: string)=> {
        console.log('item: ', item.dbCopy);

        let cancelChanges = await this.showSaveDialog();
        if(cancelChanges)
            return;

        let parentList:FrameList = this.getItemsList(item);

        if(clickedElem == undefined || clickedElem == "edit"){
            Array.from(parentList.childNodes).forEach(listItem => {
                (<FrameListItem>listItem).classList.remove("active");
            });
            item.classList.add("active");
            if(parentList.type==FrameListTypes.ROOMS){ // We want to initialize sensors and devices only when click on room, not on sensor or device
                this.initSensorsList(item);
                this.initDevicesList(item);
            }
            this.itemInDetail = {item: item, parentListType: parentList.type};
            this.initDetail();
        }else{

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
                if(parentList.type == FrameListTypes.ROOMS){
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
        
        let list = this.sensorsList;

        list.clearItems();
        list.addItems(list.addItemBtn);
        for (let i = 0; i < orderedIN.length; i++) {
            let bottom = (i!=(orderedIN.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, orderedIN[i], {up: (i!=0), down: (i!=(orderedIN.length-1))});
            list.addItems(item);
        }
        if(!orderedIN || !orderedIN.length){
            list.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Nenalezeny žádné senzory pro zvolenou místnost. Zkuste nějaké přidat");
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();
        
    }

    initDevicesList=(item)=>{
        
        let ordered = RoomCard.getOrderedINOUT(item.dbCopy.devices, item.dbCopy.dbName);
        let orderedOUT = ordered.orderedOUT;
        
        let list = this.devicesList;

        list.clearItems();
        list.addItems(list.addItemBtn);
        for (let i = 0; i < orderedOUT.length; i++) {
            let bottom = (i!=(orderedOUT.length-1))? "1px solid var(--default-blue-color)" : "none";
            let item = new FrameListItem({borderBottom: bottom});
            item.initialize(ItemTypes.CLASSIC, this.itemClicked, orderedOUT[i], {up: (i!=0), down: (i!=(orderedOUT.length-1))});
            list.addItems(item);
        }

        if(!orderedOUT || !orderedOUT.length){
            list.defaultItem.initialize(ItemTypes.TEXT_ONLY, "Nenalezeny žádná zařízení pro zvolenou místnost. Zkuste nějaké přidat");
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();
    }

    initDetail(){
        let item = this.itemInDetail.item;
        let parenListType = this.itemInDetail.parentListType;
        let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
        let values;
        if(parenListType == FrameListTypes.ROOMS){
            values = [item.dbCopy.name, item.dbCopy.img.src, item.dbCopy.img.offset];
        }else if(parenListType == FrameListTypes.SENSORS){
            values = [item.dbCopy.name, item.dbCopy.icon, item.dbCopy.unit];
        }else if(parenListType == FrameListTypes.DEVICES){
            values = [item.dbCopy.name, item.dbCopy.icon];
        }
        this.detail.updateDetail(title, parenListType, (event)=>{this.readyToSave = true}, values);
        
    }

}
