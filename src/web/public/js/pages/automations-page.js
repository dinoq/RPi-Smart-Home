import { DBTemplates, List, ListItem, ListTypes } from "../layouts/list-component.js";
import { Firebase } from "../app/firebase.js";
import { Utils } from "../app/utils.js";
import { TabLayout } from "../layouts/tab-layout.js";
import { Loader } from "../components/others/loader.js";
import { AutomationDetail } from "../layouts/automation-detail.js";
import { AbstractConfigurationPage } from "./abstract-configuration-page.js";
export class AutomationsPage extends AbstractConfigurationPage {
    constructor(componentProps) {
        super(defaultItemTypesIndexes, AutomationsPage.DEFAULT_ITEMS_STRING, componentProps);
        this.setRemainingTimeTextForItem = (item) => {
            let shorterLen = 0;
            let widerLen = 0;
            if (item.checkboxLabel.innerText == "(neaktivní)") {
                shorterLen = item.checkboxLabel.clientWidth;
                item.checkboxLabel.innerText = "(zbývá: 00:00:00)";
                widerLen = item.checkboxLabel.clientWidth;
            }
            else {
                widerLen = item.checkboxLabel.clientWidth;
                item.checkboxLabel.innerText = "(neaktivní)";
                shorterLen = item.checkboxLabel.clientWidth;
            }
            if (item.checkbox.checked) {
                let currentTime = Math.round(Date.now() / 1000);
                let timeDiff = (item.dbCopy.expires > currentTime) ? (item.dbCopy.expires - currentTime) : 0;
                item.checkboxLabel.innerText = this.secondsToRemainingStr(timeDiff);
                item.checkboxLabel.style.paddingRight = 0 + "px";
            }
            else {
                item.checkboxLabel.innerText = "(neaktivní)";
                item.checkboxLabel.style.paddingRight = (widerLen - shorterLen) + "px";
            }
        };
        this.updateTimeoutCheckboxes = (newAutomations) => {
            if (!newAutomations) {
                return;
            }
            return;
            let timeoutAutomations = new Array();
            for (const automationID in newAutomations) {
                let automation = newAutomations[automationID];
                if (automation && automation.type == "timeout") {
                    timeoutAutomations.push(automation);
                    timeoutAutomations[timeoutAutomations.length - 1]["path"] = "automations/" + automationID;
                    timeoutAutomations[timeoutAutomations.length - 1]["dbID"] = automationID;
                }
            }
            let timeoutListItems = this.timeoutAutomationsList.getItems().items;
            for (let item of timeoutListItems) {
                let newAutomation = (item.dbCopy.dbID != undefined) ? newAutomations[item.dbCopy.dbID] : undefined;
                if (!newAutomation) {
                    continue;
                }
                if (newAutomation.expires > -1) {
                }
            }
            /*
            let timeoutListItems = this.timeoutAutomationsList.getItems().items;
            let oldAutomationIDs = timeoutListItems.map(list => (<ListItem>list).dbCopy.dbID)
            let oldAutomationVals = timeoutListItems.map(list => (<ListItem>list).dbCopy)
            var oldAutomations = {};
            oldAutomationIDs.forEach((dbID, i) => oldAutomations[dbID] = oldAutomationVals[i]);
            for (const automationID in newAutomations) {
                let newAutomation = newAutomations[automationID];
                let oldAutomation = oldAutomations[automationID];
                if (newAutomation && newAutomation.type == "timeout"
                    && oldAutomation && oldAutomation.type == "timeout") {
                        if(oldAutomation.expires != newAutomation.expires){
                            if(oldAutomation.expires > -1 && newAutomation.expires > -1){ //Oba časovače aktivní, ale změnila se doba časovače
                                if(oldAutomation.timeout != undefined){
                                    clearTimeout(oldAutomation.timeout)
                                }
                                oldAutomation.expires = newAutomation.expires;
                                oldAutomation.value=600;
                                let timeDiff = Number.parseInt(oldAutomation.expires) - Math.round(Date.now() / 1000);
                                oldAutomation.timeout =
                                oldAutomation.timeout = setTimeout(() => {
                                    item.checkbox.checked = false;
                                    setTextAndRemainingPadding();
                                }, timeDiff * 1000)
                            }
                        }
                }
            }*/
        };
        /**
         * Komentář viz. předek (AbstractConfigurationPage)
         */
        this.saveChanges = async (event) => {
            let path = "";
            let name = document.getElementById("automation-name").value;
            let update = { name: name };
            const listType = this.itemInDetail.parentListType;
            if (listType == ListTypes.TIMEOUT) {
                let timeHours = Number.parseInt(document.getElementById("time-h").value);
                timeHours = (Number.isSafeInteger(timeHours)) ? timeHours : 0;
                timeHours = (timeHours >= 0) ? timeHours : 0;
                let timeMinutes = Number.parseInt(document.getElementById("time-m").value);
                timeMinutes = (Number.isSafeInteger(timeMinutes)) ? timeMinutes : 0;
                timeMinutes = (timeMinutes >= 0) ? timeMinutes : 0;
                let timeSeconds = Number.parseInt(document.getElementById("time-s").value);
                timeSeconds = (Number.isSafeInteger(timeSeconds)) ? timeSeconds : 0;
                timeSeconds = (timeSeconds >= 0) ? timeSeconds : 0;
                let time = timeSeconds + 60 * timeMinutes + 3600 * timeHours;
                let checked = document.getElementById("checkbox-active").checked;
                let controlledOutput = document.getElementById("controlled-output").value;
                let valueToSet = Number.parseInt(document.getElementById("value-to-set").value);
                update.type = "timeout";
                update.time = time;
                update.controlledOutput = controlledOutput;
                update.expires = (checked) ? Math.round(Date.now() / 1000) + time : -1;
                update.value = valueToSet;
                path = this.itemInDetail.item.dbCopy.path;
            }
            else if (listType == ListTypes.SENSORS_AUTOMATIONS) {
                console.log("TODO save SENSORS_AUTOMATIONS");
            }
            await Firebase.updateDBData(path, update);
            await this.pageReinicialize();
            this.detail.readyToSave = false;
        };
        /**
         * Komentář viz. předek (AbstractConfigurationPage)
         */
        this.initDetail = async () => {
            let item = this.itemInDetail.item;
            let parentListType = this.itemInDetail.parentListType;
            let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
            let values = new Array();
            if (parentListType == ListTypes.TIMEOUT) {
                values = [
                    { selectedValue: item.dbCopy.name },
                    { selectedValue: item.dbCopy.time },
                    {
                        selectedValue: item.dbCopy.controlledOutput,
                        options: {
                            optionTexts: (await this.getAllIOForSelectbox()).out.texts,
                            optionValues: (await this.getAllIOForSelectbox()).out.values
                        }
                    },
                    { selectedValue: item.dbCopy.value },
                    { selectedValue: (item.dbCopy.expires > Math.round(Date.now() / 1000)) }
                ];
            }
            else if (parentListType == ListTypes.SENSORS_AUTOMATIONS) {
                console.log("TODO SENSORS_AUTOMATIONS initDetail");
                values = [
                    { selectedValue: item.dbCopy.name },
                    {
                        selectedValue: item.dbCopy.watchedInput,
                        options: {
                            optionTexts: (await this.getAllIOForSelectbox()).in.texts,
                            optionValues: (await this.getAllIOForSelectbox()).in.values
                        }
                    },
                    { selectedValue: item.dbCopy.threshold },
                    {
                        selectedValue: item.dbCopy.controlledOutput,
                        options: {
                            optionTexts: (await this.getAllIOForSelectbox()).out.texts,
                            optionValues: (await this.getAllIOForSelectbox()).out.values
                        }
                    },
                    { selectedValue: item.dbCopy.value },
                    { selectedValue: true }
                ];
            }
            this.detail.updateDetail(title, parentListType, values);
        };
        /**
         * Komentář viz. předek (AbstractConfigurationPage)
         */
        this._itemClicked = async (parentList, event, item, clickedElem, clickedByUser) => {
            console.log('clickedByUser: ', clickedByUser);
            console.log('clickedElem: ', clickedElem);
            console.log('item.dbCopy: ', item.dbCopy);
            if (clickedElem == "add") { // Add item to database
                if (!Utils.itemIsAnyFromEnum(parentList.type, ListTypes, ["TIMEOUT", "SENSORS_AUTOMATIONS"])) {
                    if (this.clickPromiseResolver)
                        this.clickPromiseResolver();
                    return;
                }
                let data = DBTemplates[ListTypes[parentList.type]]; // Get template of data from list type
                let key = (await Firebase.pushNewDBData(item.dbCopy.parentPath, data)).key;
                // Re-inicialize page
                await this.pageReinicialize();
                //Select aded item
                let newItem = parentList.getItems().items[0];
                await this.itemClicked(null, newItem, "edit");
                this._focusDetail = true;
            }
            else if (clickedElem == "delete") {
                await Firebase.deleteDBData(item.dbCopy.path);
                item.disconnectComponent();
                if (parentList.getItems().items.length == 0) { // If list contains only "add" button, add default item
                    parentList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(parentList.type, true));
                }
                await this.pageReinicialize();
            }
            else if (clickedElem == "checkbox") {
                let checked = event.target.checked;
                let expires = -1;
                if (!checked) { // Vypnutí dané automatizace
                    item.clearTimeout();
                }
                else { //Zapnutí dané automatizace
                    expires = Math.round(Date.now() / 1000) + item.dbCopy.time;
                    item.dbCopy.expires = expires;
                    this.setRemainingTimeTextForItem(item);
                    item.resetTimeout(() => {
                        item.checkbox.checked = false;
                        this.setRemainingTimeTextForItem(item);
                    }, item.dbCopy.time, (secondsRemaining) => {
                        item.checkboxLabel.innerText = this.secondsToRemainingStr(secondsRemaining);
                    });
                }
                await Firebase.updateDBData(item.dbCopy.path, { expires: expires });
                await this.pageReinicialize();
            }
        };
        this.detail = new AutomationDetail(this.saveChanges, this.initDetail);
        this.timeoutAutomationsTabPanel = new TabLayout(null);
        this.sensorAutomationsTabPanel = new TabLayout(null);
        this.timeoutAutomationsList = new List({
            type: ListTypes.TIMEOUT,
            addBtnCallback: this.itemClicked
        });
        this.timeoutAutomationsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.TIMEOUT));
        this.allListComponents.push(this.timeoutAutomationsList);
        this.sensorAutomationsList = new List({
            type: ListTypes.SENSORS_AUTOMATIONS,
            addBtnCallback: this.itemClicked
        });
        this.sensorAutomationsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS_AUTOMATIONS));
        this.allListComponents.push(this.sensorAutomationsList);
        this.timeoutAutomationsTabPanel.addTab("Časovače", this.timeoutAutomationsList);
        this.sensorAutomationsTabPanel.addTab("Automatizace snímačů", this.sensorAutomationsList);
        this.appendComponents([this.timeoutAutomationsTabPanel, this.sensorAutomationsTabPanel, this.detail]);
        try {
            Loader.show();
            this.initPageFromDB().then((value) => {
                Firebase.addDBListener("/automations", this.updateTimeoutCheckboxes);
            });
        }
        catch (err) {
            Loader.hide();
        }
    }
    initTimeoutList(automations) {
        let list = this.timeoutAutomationsList;
        list.clearItems();
        list.updateAddItemBtn("/automations/");
        console.log('automations: ', automations);
        if (!automations.length) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.TIMEOUT, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.TIMEOUT, true)
            });
            list.addItems(list.defaultItem);
        }
        else {
            for (let i = 0; i < automations.length; i++) {
                let bottom = (i != (automations.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
                let item = new ListItem({ borderBottom: bottom });
                //item.initialize(ListTypes.ROOMS, this.itemClicked, timeoutAutomations[i], timeoutAutomations[i].name, { up: (i != 0), down: (i != (timeoutAutomations.length - 1)) });
                item.initializeItem({
                    type: ListTypes.TIMEOUT,
                    onClickCallback: this.itemClicked,
                    dbCopy: automations[i],
                    expandableText: "" + automations[i].name,
                    checkable: true,
                    editable: true,
                    deletable: true
                });
                list.addItems(item);
                if (automations[i].expires == -1) {
                    item.checkbox.checked = false;
                    this.setRemainingTimeTextForItem(item);
                }
                else {
                    if (automations[i].expires < Math.round(Date.now() / 1000)) {
                        item.checkbox.checked = false;
                        this.setRemainingTimeTextForItem(item);
                    }
                    else {
                        item.checkbox.checked = true;
                        this.setRemainingTimeTextForItem(item);
                        let timeDiff = automations[i].expires - Math.round(Date.now() / 1000);
                        item.resetTimeout(() => {
                            item.checkbox.checked = false;
                            this.setRemainingTimeTextForItem(item);
                        }, timeDiff, (secondsRemaining) => {
                            item.checkboxLabel.innerText = this.secondsToRemainingStr(secondsRemaining);
                        });
                    }
                }
            }
            list.updatedOrderHandler();
        }
    }
    initSensorAutomationsList(automations) {
        let list = this.sensorAutomationsList;
        list.clearItems();
        list.updateAddItemBtn("/automations/");
        console.log('sensor automations: ', automations);
        if (!automations.length) {
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.SENSORS_AUTOMATIONS, true)
            });
            list.addItems(list.defaultItem);
        }
        else {
            for (let i = 0; i < automations.length; i++) {
                let bottom = (i != (automations.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
                let item = new ListItem({ borderBottom: bottom });
                item.initializeItem({
                    type: ListTypes.SENSORS_AUTOMATIONS,
                    onClickCallback: this.itemClicked,
                    dbCopy: automations[i],
                    expandableText: "" + automations[i].name,
                    checkable: true,
                    editable: true,
                    deletable: true
                });
                list.addItems(item);
                item.checkbox.checked = automations[i].active;
            }
            list.updatedOrderHandler();
        }
    }
    secondsToRemainingStr(secondsRemaining) {
        secondsRemaining = (secondsRemaining && secondsRemaining > 0) ? secondsRemaining : 0;
        let hours = Math.floor(secondsRemaining / 3600);
        secondsRemaining = secondsRemaining - hours * 3600;
        let minutes = Math.floor(secondsRemaining / 60);
        let seconds = secondsRemaining - minutes * 60;
        let hoursStr = "0" + hours;
        hoursStr = hoursStr.substring(hoursStr.length - 2);
        let minutesStr = "0" + minutes;
        minutesStr = minutesStr.substring(minutesStr.length - 2);
        let secondsStr = "0" + seconds;
        secondsStr = secondsStr.substring(secondsStr.length - 2);
        return `(zbývá: ${hoursStr}:${minutesStr}:${secondsStr})`;
    }
    //########################################
    // Přepsané (abstraktní) funkce (a pro ně pomocné funkce) z předka:
    //########################################
    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    async initPageFromDB() {
        let automations = await Firebase.getDBData("/automations/");
        console.log('data: ', automations);
        let timeoutAutomations = new Array();
        let sensorAutomations = new Array();
        for (const automationID in automations) {
            let automation = automations[automationID];
            automation.path = "automations/" + automationID;
            automation.dbID = automationID;
            if (automation.type == "timeout") {
                timeoutAutomations.push(automation);
            }
            else if (automation.type == "automation") {
                sensorAutomations.push(automation);
            }
            else {
                //new BaseDialogError("Neznámý typ automatizace v databázi!", this);
            }
        }
        this.automations = automations;
        timeoutAutomations.reverse();
        this.initTimeoutList(timeoutAutomations);
        this.timeoutAutomations = timeoutAutomations;
        this.initSensorAutomationsList(sensorAutomations);
        this.detail.readyToSave = false;
        Loader.hide();
    }
    async getAllIOForSelectbox() {
        let INtexts = new Array();
        let INvalues = new Array();
        let OUTtexts = new Array();
        let OUTvalues = new Array();
        let rooms = await Firebase.getDBData("rooms");
        for (const roomID in rooms) {
            let room = rooms[roomID];
            let modules = room["devices"];
            for (const moduleID in modules) {
                let module = modules[moduleID];
                let sensors = module["IN"];
                for (const sensorID in sensors) {
                    let sensor = sensors[sensorID];
                    let namesPath = `${room.name}/${module.name}/${sensor.name}`;
                    INtexts.push(namesPath);
                    let path = `rooms/${roomID}/devices/${moduleID}/IN/${sensorID}`;
                    INvalues.push(path);
                }
                let devices = module["OUT"];
                for (const deviceID in devices) {
                    let device = devices[deviceID];
                    let namesPath = `${room.name}/${module.name}/${device.name} (pin ${device.output}, ${(device.type == "analog") ? "analogový" : "digitální"} výstup)`;
                    OUTtexts.push(namesPath);
                    let path = `rooms/${roomID}/devices/${moduleID}/OUT/${deviceID}`;
                    OUTvalues.push(path);
                }
            }
        }
        if (!OUTtexts.length) {
            OUTtexts.push("Nejprve v nastavení přidejte nějaká zařízení!");
            OUTvalues.push("");
        }
        else {
            OUTtexts.unshift("Vyberte výstup, který chcete ovládat...");
            OUTvalues.unshift("");
        }
        if (!INtexts.length) {
            INtexts.push("Nejprve v nastavení přidejte nějaké snímače!");
            INvalues.push("");
        }
        else {
            INtexts.unshift("Vyberte snámač, jehož hodnota bude řídit výstup...");
            INvalues.unshift("");
        }
        return {
            in: {
                texts: INtexts,
                values: INvalues
            },
            out: {
                texts: OUTtexts,
                values: OUTvalues
            }
        };
    }
}
AutomationsPage.tagName = "automations-page";
AutomationsPage.DEFAULT_ITEMS_STRING = {
    noItem: [
        "Žádné časovače v databázi. Zkuste nějaké přidat.",
        "Žádné automatizace na základě hodnot snímačů v databázi. Zkuste nějaké přidat."
    ],
    choseItem: [
        "Vyčkejte, načítají se data z databáze",
        "Vyčkejte, načítají se data z databáze"
    ]
};
var defaultItemTypesIndexes;
(function (defaultItemTypesIndexes) {
    defaultItemTypesIndexes[defaultItemTypesIndexes["TIMEOUT"] = 0] = "TIMEOUT";
    defaultItemTypesIndexes[defaultItemTypesIndexes["SENSORS_AUTOMATIONS"] = 1] = "SENSORS_AUTOMATIONS";
})(defaultItemTypesIndexes || (defaultItemTypesIndexes = {}));
;
