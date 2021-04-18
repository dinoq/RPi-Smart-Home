import { ARROWABLE_LISTS, DBTemplates, List, ListItem, ListTypes } from "../layouts/list-component.js";
import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { AbstractComponent, BaseComponent, IComponentProperties } from "../components/component.js";
import { LoginComponent } from "../components/forms/login-component.js";
import { BasePage } from "./base-page.js";
import { Utils } from "../app/utils.js";
import { HorizontalStack } from "../layouts/horizontal-stack.js";
import { TabLayout } from "../layouts/tab-layout.js";
import { BaseDetail, IDetailRowInitObject } from "../layouts/detail-component.js";
import { YesNoCancelDialog } from "../components/dialogs/yes-no-cancel-dialog.js";
import { DialogResponses } from "../components/dialogs/base-dialog.js";
import { EventManager } from "../app/event-manager.js";
import { URLManager } from "../app/url-manager.js";
import { PageManager } from "../app/page-manager.js";
import { BaseLayout } from "../layouts/base-layout.js";
import { Loader } from "../components/others/loader.js";
import { OneOptionDialog } from "../components/dialogs/cancel-dialog.js";
import { Board, BoardsManager } from "../app/boards-manager.js";
import { SettingsDetail } from "../layouts/settings-detail.js";
export class SettingsPage extends BasePage {
    static tagName = "settings-page";

    private roomsList: List;
    private modulesList: List;
    private sensorsList: List;
    private devicesList: List;

    mainTabPanel: TabLayout;
    private modulesTabPanel: TabLayout;
    private sensorsDevicesTabPanel: TabLayout;

    private saveBtnContainer: HorizontalStack;
    private detail: BaseDetail;
    private _focusDetail: boolean = true;
    private itemInDetail: { item: ListItem, parentListType: ListTypes };
    private selectedItemsIDHierarchy: string[] = new Array(3);
    rooms: any[];


    defaultItemsStrings = {
        noItem: [
            "Žádná místnost v databázi. Zkuste nějakou přidat.",
            "Nenalezeny žádné moduly pro zvolenou místnost. Zkuste nějaké přidat",
            "Nenalezeny žádné snímače pro zvolený modul. Zkuste nějaké přidat",
            "Nenalezeny žádná zařízení pro zvolený modul. Zkuste nějaké přidat"
        ],
        choseItem: [
            "Vyčkejte, načítají se data z databáze",
            "Vyberte místnost",
            "Vyberte modul",
            "Vyberte modul"
        ]
    };


    constructor(componentProps?: IComponentProperties) {
        super(componentProps);
        this.detail = new SettingsDetail(this.saveChanges, this.initDetail);

        this.mainTabPanel = new TabLayout(null);
        this.modulesTabPanel = new TabLayout(null);
        this.sensorsDevicesTabPanel = new TabLayout(null);

        this.roomsList = new List(ListTypes.ROOMS);
        this.roomsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.ROOMS));
        this.modulesList = new List(ListTypes.MODULES);
        this.modulesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES));
        this.sensorsList = new List(ListTypes.SENSORS);
        this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS));
        this.devicesList = new List(ListTypes.DEVICES);
        this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES));

        // Add tabs to all Tab Panels
        this.sensorsDevicesTabPanel.addTab("Snímače", this.sensorsList);
        this.sensorsDevicesTabPanel.addTab("Zařízení", this.devicesList);
        let modulesContainer = new BaseLayout({ componentsToConnect: [this.modulesList, this.sensorsDevicesTabPanel] });
        this.modulesTabPanel.addTab("Moduly", modulesContainer);
        let firstTab = new BaseLayout({ componentsToConnect: [this.roomsList, this.modulesTabPanel] });
        this.mainTabPanel.addTab("Místnosti", firstTab);

        this.appendComponents([this.mainTabPanel, this.detail]);

        Loader.show();
        this.initPageFromDB();

        document.addEventListener("click", async (e) => {
            let path = (<any>e).path.map((element) => {
                return (element.localName) ? element.localName : "";
            })
            if (path.includes("menu-icon") || path.includes("menu-item")) {
                await this.showSaveDialog();
            }
        });
    }

    async initPageFromDB() {
        let data = await Firebase.getDBData("/rooms/");
        Loader.hide();
        let rooms = new Array();
        for (const roomDBName in data) {
            let room = data[roomDBName];
            room.dbID = roomDBName;
            rooms.push(room);
        }

        rooms.sort((a, b) => (a.index > b.index) ? 1 : -1);
        this.rooms = rooms;
        this.initRoomsList(rooms);
        this.detail.readyToSave = false;
    }

    saveChanges = async (event) => {
        let path = "";
        let name = (<HTMLInputElement>document.getElementById("device-name")).value;
        let update: any = { name: name };
        const listType = this.itemInDetail.parentListType;
        if (listType == ListTypes.ROOMS) {
            let imgSrc = (<HTMLInputElement>document.getElementById("bg-img-src")).value;
            let imgOffset = parseFloat((<HTMLInputElement>document.getElementById("slider-for-image")).value);
            imgOffset = (isNaN(imgOffset)) ? 0 : imgOffset;

            update.img = { src: imgSrc, offset: imgOffset };
            path = "rooms/" + this.itemInDetail.item.dbCopy.dbID;
        } else if (listType == ListTypes.MODULES) {
            path = this.itemInDetail.item.dbCopy.path;
        } else if (listType == ListTypes.SENSORS) {
            let iconType = (<HTMLInputElement>document.getElementById("icon-type")).value;
            let input = (<HTMLInputElement>document.getElementById("input")).value;
            let unit = (<HTMLInputElement>document.getElementById("unit")).value;

            update.icon = iconType;
            update.input = input;
            update.unit = unit;
            path = this.itemInDetail.item.dbCopy.path;
        } else if (listType == ListTypes.DEVICES) {
            let iconType = (<HTMLInputElement>document.getElementById("icon-type")).value;
            let output = (<HTMLInputElement>document.getElementById("output")).value;
            let outputType = (<HTMLInputElement>document.getElementById("output-type")).value;

            update.icon = iconType;
            update.output = output;
            update.type = outputType;
            path = this.itemInDetail.item.dbCopy.path;
        }
        if (Object.keys(update).length != 0) { // If is there something to update...
            await Firebase.updateDBData(path, update);
            let dbID = this.itemInDetail.item.dbCopy.dbID;
            // Re-inicialize page
            await this.pageReinicialize();
        }

        this.detail.readyToSave = false;
    }

    async selectItemByID(dbID, timeLimit: number = 1000) {
        try {
            let anyItem = await this.getItemByDbID(dbID, timeLimit);
            await this.itemClicked(null, anyItem);
        } catch (err) {
            throw new Error(err);
        }
    }

    async getItemByDbID(dbID, timeLimit: number = 1000): Promise<ListItem> {
        let anyItem: ListItem = undefined;
        let sleep = undefined;
        let sleepTime = 10;
        let cycle = 0;

        while (!anyItem && (++cycle * sleepTime) <= timeLimit) {// When this method is called more than one (selecting next items in hierarchy), we need some delay to build DOM tree, so we check if item was found and if not, wait for little bit of time and try again.
            let activeRoom = <ListItem>Array.from(this.roomsList.children).find((value, index, array) => {
                return (<ListItem>value).dbCopy.dbID == dbID;
            });
            let activeModule = <ListItem>Array.from(this.modulesList.children).find((value, index, array) => {
                return (<ListItem>value).dbCopy.dbID == dbID;
            });
            let activeSensor = <ListItem>Array.from(this.sensorsList.children).find((value, index, array) => {
                return (<ListItem>value).dbCopy.dbID == dbID;
            });
            let activeDevice = <ListItem>Array.from(this.devicesList.children).find((value, index, array) => {
                return (<ListItem>value).dbCopy.dbID == dbID;
            });
            anyItem = activeRoom || activeModule || activeSensor || activeDevice;
            if (!anyItem) {
                await new Promise(resolve => sleep = setTimeout(resolve, sleepTime));
            }
        }

        if (!anyItem)
            return Promise.reject("Time limit of " + (timeLimit / 1000) + " seconds expired!");
        return anyItem;

    }

    /**
     * Find out list, which is parent of item param
     * @param item Item to which we are searching parent FrameList
     */
    getItemsList(item: ListItem) {
        let lists = [this.roomsList, this.modulesList, this.sensorsList, this.devicesList];
        let list;
        lists.forEach((l) => {
            let tmpIndex = Array.from(l.childNodes).indexOf(item);
            if (tmpIndex != -1) {
                list = l;
            }
        })
        return list;
    }

    getTitleForEditingFromItem(item: ListItem, name: string) {
        let list = this.getItemsList(item);
        let title = 'Editujete ';
        switch (list.type) {
            case ListTypes.BASE:
                break;
            case ListTypes.MODULES:
                title += 'modul ';
                break;
            case ListTypes.SENSORS:
                title += 'snímač ';
                break;
            case ListTypes.DEVICES:
                title += 'zařízení ';
                break;
            case ListTypes.ROOMS:
                title += 'místnost ';
                break;
        }

        title += '"' + name + '"';
        return title;
    }

    /**
     * Show Save dialog and call events to unblock EventManager (other classes can use it to know, whether they can handle events, lets see Hamb)
     */
    showSaveDialog = async () => {
        let dialog = new YesNoCancelDialog("V detailu máte rozpracované změny. <br>Uložit změny?");
        if (this.detail.readyToSave) {
            let ans = await dialog.show();
            if (ans == DialogResponses.YES) {
                this.saveChanges(null);
            } else if (ans == DialogResponses.NO) {
                this.initDetail();
                this.detail.readyToSave = false;
            } else {
                EventManager.dispatchEvent("changesCanceled");
                return true;
            }
        }
        EventManager.dispatchEvent("changesSaved");
        return false;
    }

    editSelectedItemsIDHierarchy(parentList: List, item: ListItem) {
        let index = 0;//default 0 = ROOMS
        switch (parentList.type) {
            case ListTypes.MODULES:
                index = 1;
                break;
            case ListTypes.SENSORS:
            case ListTypes.DEVICES:
                index = 2;
                break;
        }
        this.selectedItemsIDHierarchy[index] = item.dbCopy.dbID;
        if (index < 2)//remove subordinate active items from selectedItemsIDHierarchy - eg. if we save new room, we don't want to keep old modules, sensors and devices list...
            this.selectedItemsIDHierarchy.splice(index + 1);
    }

    async pageReinicialize() {
        await this.initPageFromDB();
        this.detail.initialize(this.saveChanges, this.initDetail);
        this.modulesList.initialize();
        this.sensorsList.initialize();
        this.devicesList.initialize();
        await this.selectSavedIDs();
    }

    async selectSavedIDs() {
        let tmpSelectedIDs = [...this.selectedItemsIDHierarchy]; // Method selectItemByID (which is called from this forEach) mainpulates with selectedItemsIDHierarchy array, so we need to work with copy
        for (let i = 0; i < tmpSelectedIDs.length; i++) {
            let id: string = tmpSelectedIDs[i];
            if (id) {
                try {
                    await this.selectItemByID(id);
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }

    clickPromise = Promise.resolve();
    clickPromiseResolver;
    /**
     * Event hadler for click on any FrameListItem
     * @param event Event
     * @param item Clicked Item
     * @param clickedElem Textual description of clicked element in item (like delete for delete button). Is undefined in case of click outside of particular elements (buttons)
     */
    itemClicked = async (event, item: ListItem, clickedElem?: string, clickedByUser?: boolean) => {
        if (clickedByUser) {
            await this.clickPromise;
            this.clickPromise = new Promise((resolve, reject) => { this.clickPromiseResolver = resolve; });
        }
        console.log('item: ', item.dbCopy);
        /*console.log('clickedElem: ', clickedElem);
        console.log('type: ', item.type);
        console.log('path: ', item.dbCopy.parentPath);*/

        try {
            let cancelChanges = await this.showSaveDialog();
            if (cancelChanges) {
                if (this.clickPromiseResolver)
                    this.clickPromiseResolver();
                return;
            }

            let parentList: List = this.getItemsList(item);

            if (Utils.itemIsAnyFromEnum(item.type, ListTypes, ARROWABLE_LISTS) && clickedElem !== "delete") {
                this.editSelectedItemsIDHierarchy(parentList, item);
            }

            if (clickedElem == undefined || clickedElem == "edit") {
                /**
                 * Remove class "active" from both - sensorsList and devicesList. 
                 * Because they are on same level in tab hierarchy and we dont want to keep active item from other list...
                 */
                if (Utils.itemIsAnyFromEnum(parentList.type, ListTypes, ["SENSORS", "DEVICES"])) {
                    Array.from(this.sensorsList.childNodes).forEach(listItem => {
                        (<ListItem>listItem).active = false
                    });
                    Array.from(this.devicesList.childNodes).forEach(listItem => {
                        (<ListItem>listItem).active = false
                    });
                } else {//Else remove class "active" only from current list
                    Array.from(parentList.childNodes).forEach(listItem => {
                        (<ListItem>listItem).active = false
                    });
                }
                item.active = true;
                if (parentList.type == ListTypes.ROOMS) { // We want to initialize sensors and devices only when click on room, not on sensor or device
                    await this.initModulesList(item);
                } else if (parentList.type == ListTypes.MODULES) { // We want to initialize sensors and devices only when click on room, not on sensor or device
                    this.initSensorsList(item);
                    this.initDevicesList(item);
                }
                this.itemInDetail = { item: item, parentListType: parentList.type };
                this.initDetail();

                if (this._focusDetail) {
                    this.detail.scrollIntoView();
                    this.detail.blink(1);
                }

            } else {

                let itemIndex = Array.from(parentList.childNodes).indexOf(item);
                let oldIndex = item.dbCopy.index;

                if (clickedElem == "up" || clickedElem == "down") {
                    let children = Array.from(parentList.childNodes);
                    let otherIndex = (clickedElem == "up") ? (itemIndex - 1) : (itemIndex + 1);
                    let otherItem = (<ListItem>(children[otherIndex]));
                    let newIndex = otherItem.dbCopy.index;
                    item.dbCopy.index = newIndex;
                    otherItem.dbCopy.index = oldIndex;

                    if (clickedElem == "up") {
                        parentList.insertBefore(item, otherItem);
                    } else if (clickedElem == "down") {
                        parentList.insertBefore(otherItem, item);
                    }

                    let itemPath;
                    let otherItemPath;
                    if (parentList.type == ListTypes.ROOMS) {
                        itemPath = "rooms/" + item.dbCopy.dbID;
                        otherItemPath = "rooms/" + otherItem.dbCopy.dbID;
                    } else {
                        itemPath = item.dbCopy.path;
                        otherItemPath = otherItem.dbCopy.path;
                    }
                    await Firebase.updateDBData(itemPath, { index: newIndex })
                    await Firebase.updateDBData(otherItemPath, { index: oldIndex })

                    parentList.updatedOrderHandler();
                } else if (clickedElem == "add") {// Add item to database
                    if (!Utils.itemIsAnyFromEnum(parentList.type, ListTypes, ["ROOMS", "MODULES", "SENSORS", "DEVICES"])) {
                        if (this.clickPromiseResolver)
                            this.clickPromiseResolver();
                        return;
                    }

                    if (parentList.type == ListTypes.MODULES) { // If parent list type is MODULES, don't focus to detail (due to calling this.pageReinicialize()) until new module is initialized
                        this._focusDetail = false;
                    }
                    let data = DBTemplates[ListTypes[parentList.type]]; // Get template of data from list type
                    if (parentList.type == ListTypes.DEVICES) {
                        const activeModuleType = (<ListItem>document.querySelectorAll("list-component")[1].querySelector(".active")).dbCopy.type;
                        if (Board[activeModuleType] && Board[activeModuleType].digitalPins) {
                            let dPins = Board[activeModuleType].digitalPins;
                            for (let i = 0; i < 5; i++) { //Try to set one of first 5 GPIO, BUT WHICH IS FOR GIVEN MODULE ACCESSIBLE as first option in select.
                                if (dPins["D" + i]) {
                                    data.output = "D" + dPins["D" + i];
                                }
                            }
                        }
                    }
                    let DBitems = await Firebase.getDBData(item.dbCopy.parentPath); // Get actual state of DB
                    if (DBitems) {
                        Utils.forEachLoop(DBitems, (item) => item.index = (item.index) ? item.index + 1 : 1) // Increment every child's index
                        await Firebase.updateDBData(item.dbCopy.parentPath, DBitems); // Push update to DB
                    }

                    if (Array.from(parentList.children).includes(parentList.defaultItem)) {
                        parentList.defaultItem.disconnectComponent();
                    }
                    let key = (await Firebase.pushNewDBData(item.dbCopy.parentPath, data)).key;

                    // Re-inicialize page
                    await this.pageReinicialize();

                    //Select aded item
                    let newItem: ListItem = <ListItem>parentList.children[0];
                    newItem = <ListItem>((Utils.itemIsAnyFromEnum((<ListItem>parentList.children[0]).type, ListTypes, ["BTN_ONLY"])) ? parentList.children[1] : newItem);

                    await this.itemClicked(null, newItem, "edit");

                    if (parentList.type == ListTypes.MODULES) { // Show dialog about connecting to ESP module
                        let waitingDialog = new OneOptionDialog("Čekání na propojení serveru s modulem", DialogResponses.CANCEL);
                        let noModuleDialog = new OneOptionDialog("Nepodařilo se najít nový modul.<br>Zkontrolujte, zda je modul zapnutý.", DialogResponses.OK);
                        let moduleAddedDialog = new OneOptionDialog("Modul byl úspěšně přidán!", DialogResponses.OK);
                        let noModuleFoundErrorResponse = "NO-MODULE-FOUND";
                        let moduleHasBeenFoundResponse = "MODULE-HAS-BEEN-FOUND";
                        let moduleAdditionCanceled = false;
                        let waitingForModuleResponsePromise: Promise<any> = waitingDialog.show();
                        let IDs = [...this.selectedItemsIDHierarchy];
                        let dbListenerReference: any = null;
                        if (IDs.length >= 2) {
                            let firstIteration = true;
                            dbListenerReference = await Firebase.addDBListener("/rooms/" + IDs[0] + "/devices/" + IDs[1], async (data) => {
                                if (firstIteration) { // Firebase.addDBListener gets data for first time without "event" emitted...
                                    firstIteration = false;
                                    return;
                                }
                                console.log('data: ', data);
                                console.log('waitingDialog: ', waitingDialog);
                                if (moduleAdditionCanceled) { //User canceled module addition in web client
                                    if (!data) {

                                    } else if (data.IP && data.IP.length > "?.?.?.?".length) { // Module IP exists, thus module maybe has been founded
                                        if (data.index == undefined) { // Module was deleted by web client, but RPi has founded module and update module record in DB with IP and type (so basically) created new module, but with only IP and type fields)
                                            if (Firebase.localAccess) {
                                                dbListenerReference.off(); // remove firebase listener
                                            } else {
                                                dbListenerReference.off(); // remove firebase listener
                                            }
                                            Firebase.deleteDBData("/rooms/" + IDs[0] + "/devices/" + IDs[1]); //Remove module from database
                                        }
                                    }
                                } else {
                                    if (!data) { // Module was not found, thus record was deleted in database. Hide dialog and reinit settings page...
                                        this.selectedItemsIDHierarchy.splice(1);
                                        waitingDialog.resolveShow(noModuleFoundErrorResponse);
                                    } else if (data.IP != undefined && data.IP.length >= "?.?.?.?".length) { // Module IP exists, thus module has been founded
                                        dbListenerReference.off(); // remove firebase listener
                                        waitingDialog.resolveShow(moduleHasBeenFoundResponse);
                                    }
                                }
                            });
                        }
                        let moduleFoundResponse: any = await waitingForModuleResponsePromise;
                        if (typeof moduleFoundResponse == "string") {
                            console.log(moduleFoundResponse);
                            if (moduleFoundResponse == noModuleFoundErrorResponse) {// No module found => display info dialog
                                await noModuleDialog.show();

                            } else if (moduleFoundResponse == moduleHasBeenFoundResponse) {// Module has been found!
                                await moduleAddedDialog.show();
                                //Scroll to bottom and blink detail
                                this._focusDetail = true;
                            }
                            this._focusDetail = true;
                            waitingDialog.remove();
                            this.pageReinicialize();
                        } else if (typeof moduleFoundResponse == "number") { // waitingDialog canceled
                            if (IDs.length >= 2) {
                                moduleAdditionCanceled = true;
                                console.log("cancel=>delete at: /rooms/" + IDs[0] + "/devices/" + IDs[1]);
                                await Firebase.deleteDBData("/rooms/" + IDs[0] + "/devices/" + IDs[1]); //Remove module from database
                                this.selectedItemsIDHierarchy.splice(1);
                                this.pageReinicialize();
                            }
                        }
                    }
                    this._focusDetail = true;


                } else if (clickedElem == "delete") {
                    await Firebase.deleteDBData(item.dbCopy.path);
                    item.disconnectComponent();
                    console.log("DEL", item.dbCopy.path);
                    parentList.updatedOrderHandler();
                    if (Array.from(parentList.children).length == 1 && Array.from(parentList.children).includes(parentList.addItemBtn)) { // If list contains only "add" button, add default item
                        parentList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(parentList.type, true));
                    }
                    await this.pageReinicialize();

                    if (item.active) {// We removed item, which was in detailt or item, which has selected any of its child item (eg. selected was sensor of deleted module), thus reinit child item lists
                        switch (item.type) {
                            case ListTypes.ROOMS:
                                this.modulesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES));
                                this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS));
                                this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES));
                                break;
                            case ListTypes.MODULES:
                                this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS));
                                this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES));
                                break;
                            default:
                                break;
                        }
                    }

                }

            }


        } finally {
            if (this.clickPromiseResolver)
                this.clickPromiseResolver();
        }
    }

    getOrderedINOUT = (dbCopy) => {
        let orderedIN = new Array();
        let orderedOUT = new Array();

        const devIN = dbCopy.IN;
        for (const dbID in devIN) {
            devIN[dbID].path = dbCopy.path + "/IN/" + dbID;
            devIN[dbID].dbID = dbID;
            orderedIN.push(devIN[dbID]);
        }

        const devOUT = dbCopy.OUT;
        for (const dbID in devOUT) {
            devOUT[dbID].path = dbCopy.path + "/OUT/" + dbID;
            devOUT[dbID].dbID = dbID;
            orderedOUT.push(devOUT[dbID]);
        }
        orderedIN.sort((a, b) => (a.index > b.index) ? 1 : -1);
        orderedOUT.sort((a, b) => (a.index > b.index) ? 1 : -1);
        return {
            orderedIN: orderedIN,
            orderedOUT: orderedOUT,
        }
    }

    initRoomsList(rooms: any[]) {
        let list = this.roomsList;
        list.clearItems();
        list.initAddItemBtn(this.itemClicked, "/rooms/");
        list.addItems(list.addItemBtn);
        if (!rooms.length) {
            list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.ROOMS, true));
            list.addItems(list.defaultItem);
        } else {
            for (let i = 0; i < rooms.length; i++) {
                let bottom = (i != (rooms.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
                let item = new ListItem({ borderBottom: bottom });
                rooms[i]["path"] = "rooms/" + rooms[i].dbID;
                item.initialize(ListTypes.ROOMS, this.itemClicked, rooms[i], rooms[i].name, { up: (i != 0), down: (i != (rooms.length - 1)) });
                list.addItems(item);
            }
            list.updatedOrderHandler();
        }
    }

    initModulesList = async (item) => {
        let getOrderedModules = (devices) => {
            let ordered = new Array();
            for (const dev in devices) {
                ordered.push(devices[dev]);
                devices[dev]["dbID"] = dev;
            }
            ordered.sort((a, b) => (a.index > b.index) ? 1 : -1);
            return ordered;
        }

        let devs = getOrderedModules(item.dbCopy.devices);

        let list = this.modulesList;
        list.clearItems();
        list.initAddItemBtn(this.itemClicked, "/rooms/" + item.dbCopy.dbID + "/devices/");
        list.addItems(list.addItemBtn);
        if (!devs || devs.length == 0) {
            list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES, true));
            list.addItems(list.defaultItem);
        }
        for (let i = 0; i < devs.length; i++) {
            let listItem = new ListItem();
            devs[i]["path"] = "rooms/" + item.dbCopy.dbID + "/devices/" + devs[i]["dbID"];
            //devs[devName]["parentPath"] = item.dbCopy.path;
            listItem.initialize(ListTypes.MODULES, this.itemClicked, devs[i], devs[i].name, { up: (i != 0), down: (i != (devs.length - 1)) });
            list.addItems(listItem);
        }

        // Empty sensor and device list...
        this.sensorsList.clearItems();
        this.sensorsList.addItems(this.sensorsList.defaultItem);
        this.devicesList.clearItems();
        this.devicesList.addItems(this.devicesList.defaultItem);
    }

    initSensorsList = (item) => {
        let ordered = this.getOrderedINOUT(item.dbCopy);
        let orderedIN = ordered.orderedIN;

        let list = this.sensorsList;

        list.clearItems();
        list.initAddItemBtn(this.itemClicked, item.dbCopy.path + "/IN/");
        list.addItems(list.addItemBtn);
        for (let i = 0; i < orderedIN.length; i++) {
            let bottom = (i != (orderedIN.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
            let item = new ListItem({ borderBottom: bottom });
            item.initialize(ListTypes.SENSORS, this.itemClicked, orderedIN[i], orderedIN[i].name, { up: (i != 0), down: (i != (orderedIN.length - 1)) });
            list.addItems(item);
        }
        if (!orderedIN || !orderedIN.length) {
            list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS, true));
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();

    }

    initDevicesList = (item) => {
        let ordered = this.getOrderedINOUT(item.dbCopy);
        let orderedOUT = ordered.orderedOUT;

        let list = this.devicesList;

        list.clearItems();
        list.initAddItemBtn(this.itemClicked, item.dbCopy.path + "/OUT/");
        list.addItems(list.addItemBtn);
        for (let i = 0; i < orderedOUT.length; i++) {
            let bottom = (i != (orderedOUT.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
            let item = new ListItem({ borderBottom: bottom });
            item.initialize(ListTypes.DEVICES, this.itemClicked, orderedOUT[i], orderedOUT[i].name, { up: (i != 0), down: (i != (orderedOUT.length - 1)) });
            list.addItems(item);
        }

        if (!orderedOUT || !orderedOUT.length) {
            list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES, true));
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();
    }

    initDetail = () => {
        let item = this.itemInDetail.item;
        let parentListType = this.itemInDetail.parentListType;
        let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
        let values: Array<IDetailRowInitObject>;
        if (parentListType == ListTypes.ROOMS) {
            values = [
                { selectedValue: item.dbCopy.name },
                { selectedValue: item.dbCopy.img.src },
                { selectedValue: item.dbCopy.img.offset }
            ]
        } else if (parentListType == ListTypes.MODULES) {
            values = [
                { selectedValue: item.dbCopy.name },
                { selectedValue: item.dbCopy.dbID },
                { selectedValue: item.dbCopy.type },
                { selectedValue: item.dbCopy.IP },
            ]
        } else if (parentListType == ListTypes.SENSORS) {
            let type;
            console.log("zřejmě se zde bude nutné ptát na item.dbCopy.type a ne input");
            if (item.dbCopy.input.charAt(0) == "A")
                type = "analog";
            else if (item.dbCopy.input.charAt(0) == "D")
                type = "digital";
            else
                type = "bus";

            let selectedModule = <ListItem>document.querySelectorAll("list-component")[1].querySelector(".active");
            let boardType = selectedModule.dbCopy.type;
            let i2cPins = (Board[boardType]) ? Board[boardType].i2cPins : undefined;
            let i2cText = (i2cPins) ? `Sběrnice I2C (SCL = pin ${i2cPins.SCL}, SDA = pin ${i2cPins.SDA})` : "Sběrnice I2C (chybí!)";
            values = [
                { selectedValue: item.dbCopy.name },
                {
                    selectedValue: type,
                    options: {
                        optionTexts: ["Digitální pin", "Analogový pin", i2cText],
                        optionValues: ["digital", "analog", "bus"]
                    }
                },
                {
                    selectedValue: item.dbCopy.input,
                    dependsOnProps: {
                        dependsOnID: "input-type",
                        optionTexts: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "text"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "text"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "text")  //i2c
                        ],
                        optionValues: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "value"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "value"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "value")  //i2c
                        ]
                    }
                },
                {
                    selectedValue: item.dbCopy.unit,
                    dependsOnProps: {
                        dependsOnID: "input-type",
                        optionTexts: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "text"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "text"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "text")  //i2c
                        ],
                        optionValues: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "value"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "value"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "value")  //i2c
                        ]
                    }
                },
                {
                    selectedValue: item.dbCopy.icon,
                    dependsOnProps: {
                        dependsOnID: "input-type",
                        optionTexts: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "text"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "text"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "text")  //i2c
                        ],
                        optionValues: [
                            BoardsManager.mapToArrayForSelect("digital", boardType, "value"),  // digital
                            BoardsManager.mapToArrayForSelect("analog", boardType, "value"),  //analog
                            BoardsManager.mapToArrayForSelect("bus", boardType, "value")  //i2c
                        ]
                    }
                }
            ]
        } else if (parentListType == ListTypes.DEVICES) {
            values = [item.dbCopy.name, item.dbCopy.type, item.dbCopy.output, item.dbCopy.icon];
        }
        this.detail.updateDetail(title, parentListType, values);

    }

    itemTypeToDefaultTypeIndex(type: ListTypes) {
        return defaultItemTypesIndexes[ListTypes[type]];
    }

    itemTypeToDefItmStr(type: ListTypes, noItem: boolean = false) {
        if (noItem) {
            return this.defaultItemsStrings.noItem[this.itemTypeToDefaultTypeIndex(type)];
        } else {
            return this.defaultItemsStrings.choseItem[this.itemTypeToDefaultTypeIndex(type)];
        }
    }

}


enum defaultItemTypesIndexes {
    ROOMS,
    MODULES,
    SENSORS,
    DEVICES
};
