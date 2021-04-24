import { ARROWABLE_LISTS, DBTemplates, List, ListItem, ListTypes } from "../layouts/list-component.js";
import { RoomCard } from "../layouts/room-card.js";
import { Config } from "../app/config.js";
import { DatabaseData, Firebase } from "../app/firebase.js";
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
import { AbstractConfigurationPage } from "./abstract-configuration-page.js";
export class SettingsPage extends AbstractConfigurationPage {
    static tagName = "settings-page";

    public roomsList: List;
    public modulesList: List;
    public sensorsList: List;
    public devicesList: List;

    mainTabPanel: TabLayout;
    private modulesTabPanel: TabLayout;
    private sensorsDevicesTabPanel: TabLayout;

    protected detail: BaseDetail;
    rooms: any[];

    static DEFAULT_ITEMS_STRING = {
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
        super(defaultItemTypesIndexes, SettingsPage.DEFAULT_ITEMS_STRING, componentProps);
        this.detail = new SettingsDetail(this.saveChanges, this.initDetail);

        this.mainTabPanel = new TabLayout(null);
        this.modulesTabPanel = new TabLayout(null);
        this.sensorsDevicesTabPanel = new TabLayout(null);

        this.roomsList = new List({
            type: ListTypes.ROOMS,
            addBtnCallback: this.itemClicked
        });
        this.roomsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.ROOMS));
        this.allListComponents.push(this.roomsList)

        this.modulesList = new List({
            type: ListTypes.MODULES,
            addBtnCallback: this.itemClicked
        });
        this.modulesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES), true);
        this.modulesList.disableAddBtn();
        this.allListComponents.push(this.modulesList)

        this.sensorsList = new List({
            type: ListTypes.SENSORS,
            addBtnCallback: this.itemClicked
        });
        this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS), true);
        this.sensorsList.disableAddBtn();
        this.allListComponents.push(this.sensorsList)

        this.devicesList = new List({
            type: ListTypes.DEVICES,
            addBtnCallback: this.itemClicked
        });
        this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES), true);
        this.devicesList.disableAddBtn();
        this.allListComponents.push(this.devicesList)

        // Add tabs to all Tab Panels
        this.sensorsDevicesTabPanel.addTab("Snímače", this.sensorsList);
        this.sensorsDevicesTabPanel.addTab("Zařízení", this.devicesList);
        let modulesContainer = new BaseLayout({ componentsToConnect: [this.modulesList, this.sensorsDevicesTabPanel] });
        this.modulesTabPanel.addTab("Moduly", modulesContainer);
        let firstTab = new BaseLayout({ componentsToConnect: [this.roomsList, this.modulesTabPanel] });
        this.mainTabPanel.addTab("Místnosti", firstTab);

        this.appendComponents([this.mainTabPanel, this.detail]);

        try {
            Loader.show();
            this.initPageFromDB();
        } catch (err) {
            Loader.hide();
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
        list.updateAddItemBtn("/rooms/");
        if (!rooms.length) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.ROOMS, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.ROOMS, true)
            })
            list.addItems(list.defaultItem);
        } else {
            for (let i = 0; i < rooms.length; i++) {
                let bottom = (i != (rooms.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
                let item = new ListItem({ borderBottom: bottom });
                rooms[i]["path"] = "rooms/" + rooms[i].dbID;
                //item.initialize(ListTypes.ROOMS, this.itemClicked, rooms[i], rooms[i].name, { up: (i != 0), down: (i != (rooms.length - 1)) });
                item.initializeItem({
                    type: ListTypes.ROOMS,
                    onClickCallback: this.itemClicked,
                    dbCopy: rooms[i],
                    expandableText: rooms[i].name,
                    showArrows: {
                        up: (i != 0),
                        down: (i != (rooms.length - 1))
                    },
                    editable: true,
                    deletable: true
                })
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
        list.updateAddItemBtn("/rooms/" + item.dbCopy.dbID + "/devices/");
        if (!devs || devs.length == 0) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.MODULES, true)
            })
            list.addItems(list.defaultItem);
        }
        for (let i = 0; i < devs.length; i++) {
            let listItem = new ListItem();
            devs[i]["path"] = "rooms/" + item.dbCopy.dbID + "/devices/" + devs[i]["dbID"];
            //devs[devName]["parentPath"] = item.dbCopy.path;
            //listItem.initialize(ListTypes.MODULES, this.itemClicked, devs[i], devs[i].name, { up: (i != 0), down: (i != (devs.length - 1)) });
            listItem.initializeItem({
                type: ListTypes.MODULES,
                onClickCallback: this.itemClicked,
                dbCopy: devs[i],
                expandableText: devs[i].name,
                showArrows: {
                    up: (i != 0),
                    down: (i != (devs.length - 1))
                },
                editable: true,
                deletable: true
            })
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
        list.updateAddItemBtn(item.dbCopy.path + "/IN/");
        for (let i = 0; i < orderedIN.length; i++) {
            let bottom = (i != (orderedIN.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
            let item = new ListItem({ borderBottom: bottom });
            //item.initialize(ListTypes.SENSORS, this.itemClicked, orderedIN[i], orderedIN[i].name, { up: (i != 0), down: (i != (orderedIN.length - 1)) });
            item.initializeItem({
                type: ListTypes.SENSORS,
                onClickCallback: this.itemClicked,
                dbCopy: orderedIN[i],
                expandableText: orderedIN[i].name,
                showArrows: {
                    up: (i != 0),
                    down: (i != (orderedIN.length - 1))
                },
                editable: true,
                deletable: true
            });
            list.addItems(item);
        }
        if (!orderedIN || !orderedIN.length) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.SENSORS, true)
            });
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();

    }

    initDevicesList = (item) => {
        let ordered = this.getOrderedINOUT(item.dbCopy);
        let orderedOUT = ordered.orderedOUT;

        let list = this.devicesList;

        list.clearItems();
        list.updateAddItemBtn(item.dbCopy.path + "/OUT/");
        for (let i = 0; i < orderedOUT.length; i++) {
            let bottom = (i != (orderedOUT.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
            let item = new ListItem({ borderBottom: bottom });
            //item.initialize(ListTypes.DEVICES, this.itemClicked, orderedOUT[i], orderedOUT[i].name, { up: (i != 0), down: (i != (orderedOUT.length - 1)) });
            item.initializeItem({
                type: ListTypes.DEVICES,
                onClickCallback: this.itemClicked,
                dbCopy: orderedOUT[i],
                expandableText: orderedOUT[i].name,
                showArrows: {
                    up: (i != 0),
                    down: (i != (orderedOUT.length - 1))
                },
                editable: true,
                deletable: true
            });
            list.addItems(item);
        }

        if (!orderedOUT || !orderedOUT.length) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.DEVICES, true)
            });
            list.addItems(list.defaultItem);
        }
        list.updatedOrderHandler();
    }


    /**
     * Funkce vrátí pole hodnot pro inicializaci detailu pro snímač. 
     * Tohle je řešeno samostatnou funkcí proto, protože kód je velmi dlouhý na to, aby byl součástí funkce this.initDetail()
     * @returns Pole hodnot pro inicializaci detailu pro snímač
     */
    getSensorValuesForDetail() {
        let item = this.itemInDetail.item;
        let selectedModule = <ListItem>document.querySelectorAll("settings-page list-component")[1].querySelector(".active");
        let boardType = selectedModule.dbCopy.type;
        let i2cPins = (Board[boardType]) ? Board[boardType].i2cPins : undefined;
        let i2cText = (i2cPins) ? `Sběrnice I2C (SCL = pin ${i2cPins.SCL}, SDA = pin ${i2cPins.SDA})` : "Sběrnice I2C (chybí!)";
        let type;
        if (item.dbCopy.input.charAt(0) == "A")
            type = "analog";
        else if (item.dbCopy.input.charAt(0) == "D")
            type = "digital";
        else
            type = "bus";
        return [
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
                        ["On / Off", "Zapnuto / Vypnuto", "Sepnuto / Rozepnuto", "Zavřeno / Otevřeno"],  // digital
                        ["°C", "% (přepočet z 0 až 1023 na 0% až 100%)", "číslo 0-1023 (Bez jednotky)"],  //analog                
                        ["°C", "% (bez přepočtu)", "číslo 0-1023 (Bez jednotky)"]  //bus
                    ],
                    optionValues: [
                        ["on-off0", "on-off1", "on-off2", "on-off3"],  // digital
                        ["c", "percentages", "number"],  //analog                
                        ["c", "percentages", "number"]  //bus
                    ]
                }
            },
            {
                selectedValue: item.dbCopy.icon,
                dependsOnProps: {
                    dependsOnID: "input-type",
                    optionTexts: [
                        ["Spínač", "Bez ikony"],  // Digital
                        ["Teploměr", "Tlakoměr", "Vlhkost", "Bez ikony"],  // Analog
                        ["Teploměr", "Senzor BMP (teplota)", "Senzor SHT (teplota)", "Tlakoměr", "Vlhkost", "Bez ikony"]  // Bus
                    ],
                    optionValues: [
                        ["switch", "-"],  // Digital
                        ["temp", "press", "hum", "-"],  // Analog
                        ["temp", "bmp-temp", "sht-temp", "press", "hum", "-"]  // Bus
                    ]
                }
            }
        ]
    }

    //########################################
    // Přepsané (abstraktní) funkce z předka:
    //########################################
    
    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    async initPageFromDB() {
        let data = await Firebase.getDBData("/rooms/");
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
        Loader.hide();
    }
    
    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    saveChanges = async (event) => {
        let path = "";
        let name = (<HTMLInputElement>document.getElementById("device-name")).value;
        let update: DatabaseData = {name: name};
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
        await Firebase.updateDBData(path, update);
        await this.pageReinicialize();

        this.detail.readyToSave = false;
    }

    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
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
            values = this.getSensorValuesForDetail();
        } else if (parentListType == ListTypes.DEVICES) {
            let selectedModule = <ListItem>document.querySelectorAll("settings-page list-component")[1].querySelector(".active");
            let boardType = selectedModule.dbCopy.type;
            values = [
                { selectedValue: item.dbCopy.name },
                {
                    selectedValue: item.dbCopy.type,
                    options: {
                        optionTexts: ["Digitální výstup", "Analogový výstup"],
                        optionValues: ["digital", "analog"]
                    }
                },
                {
                    selectedValue: item.dbCopy.output,
                    options: {
                        optionTexts: BoardsManager.mapToArrayForSelect("digital", boardType, "text"),
                        optionValues: BoardsManager.mapToArrayForSelect("digital", boardType, "value")
                    }
                },
                {
                    selectedValue: item.dbCopy.icon,
                    dependsOnProps: {
                        dependsOnID: "output-type",
                        optionTexts: [
                            ["Světlo", "Spínač", "Motor"],  // digital
                            ["Stmívatelné světlo"]  //analog
                        ],
                        optionValues: [
                            ["light", "switch", "motor"],  // digital
                            ["dimmable-light"]  //analog
                        ]
                    }
                }
            ]
        }
        this.detail.updateDetail(title, parentListType, values);
    }
    
    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
     _itemClicked = async (parentList: List, event, item: ListItem, clickedElem?: string, clickedByUser?: boolean) => {
        if (clickedElem == undefined || clickedElem == "edit") {
            if (parentList.type == ListTypes.ROOMS) { // We want to initialize sensors and devices only when click on room, not on sensor or device
                await this.initModulesList(item);
                this.modulesList.enableAddBtn();
                this.sensorsList.disableAddBtn();
                this.devicesList.disableAddBtn();
            } else if (parentList.type == ListTypes.MODULES) { // We want to initialize sensors and devices only when click on room, not on sensor or device
                this.initSensorsList(item);
                this.initDevicesList(item);
                this.sensorsList.enableAddBtn();
                this.devicesList.enableAddBtn();
            }
        } else {

            let itemIndex = parentList.getItemIndex(item);
            let oldIndex = item.dbCopy.index;

            if (clickedElem == "up" || clickedElem == "down") {
                let children = parentList.getItems().items;
                let otherIndex = (clickedElem == "up") ? (itemIndex - 1) : (itemIndex + 1);
                let otherItem = (<ListItem>(children[otherIndex]));
                let newIndex = otherItem.dbCopy.index;
                item.dbCopy.index = newIndex;
                otherItem.dbCopy.index = oldIndex;

                if (clickedElem == "up") {
                    parentList.listItemsContainer.insertBefore(item, otherItem);
                } else if (clickedElem == "down") {
                    parentList.listItemsContainer.insertBefore(otherItem, item);
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
                    const activeModuleType = (<ListItem>document.querySelectorAll("settings-page list-component")[1].querySelector(".active")).dbCopy.type;
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

                let key = (await Firebase.pushNewDBData(item.dbCopy.parentPath, data)).key;

                // Re-inicialize page
                await this.pageReinicialize();

                //Select aded item
                let newItem: ListItem = <ListItem>parentList.getItems().items[0];

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
                parentList.updatedOrderHandler();
                if (parentList.getItems().items.length == 0) { // If list contains only "add" button, add default item
                    parentList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(parentList.type, true));
                }
                await this.pageReinicialize();

                if (item.active) {// We removed item, which was in detailt or item, which has selected any of its child item (eg. selected was sensor of deleted module), thus reinit child item lists
                    switch (item.type) {
                        case ListTypes.ROOMS:
                            this.modulesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.MODULES), true);
                            this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS), true);
                            this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES), true);
                            break;
                        case ListTypes.MODULES:
                            this.sensorsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS), true);
                            this.devicesList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.DEVICES), true);
                            break;
                        default:
                            break;
                    }
                }

            }

        }
    }

    //##############################
    // Konec abstraktních funkcí
    //##############################
    

}


enum defaultItemTypesIndexes {
    ROOMS,
    MODULES,
    SENSORS,
    DEVICES
};
