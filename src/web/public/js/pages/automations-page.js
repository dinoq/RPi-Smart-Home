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
        /**
         * Komentář viz. předek (AbstractConfigurationPage)
         */
        this.saveChanges = async (event) => {
        };
        /**
         * Komentář viz. předek (AbstractConfigurationPage)
         */
        this.initDetail = () => {
            let item = this.itemInDetail.item;
            let parentListType = this.itemInDetail.parentListType;
            let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
            let values = new Array();
            if (parentListType == ListTypes.TIMEOUT) {
                values = [
                    { selectedValue: item.dbCopy.name },
                    { selectedValue: "TODOOOO" }
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
        this.sensorAutomationsTabPanel.addTab("Automatizace na základě snímačů", this.sensorAutomationsList);
        this.appendComponents([this.timeoutAutomationsTabPanel, this.sensorAutomationsTabPanel, this.detail]);
        try {
            Loader.show();
            this.initPageFromDB();
        }
        catch (err) {
            Loader.hide();
        }
        document.addEventListener("click", async (e) => {
            let path = e.path.map((element) => {
                return (element.localName) ? element.localName : "";
            });
            if (path.includes("menu-icon") || path.includes("menu-item")) {
                await this.showSaveDialog();
            }
        });
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
                automations[i]["path"] = "automations/" + automations[i].dbID;
                //item.initialize(ListTypes.ROOMS, this.itemClicked, timeoutAutomations[i], timeoutAutomations[i].name, { up: (i != 0), down: (i != (timeoutAutomations.length - 1)) });
                item.initializeItem({
                    type: ListTypes.TIMEOUT,
                    onClickCallback: this.itemClicked,
                    dbCopy: automations[i],
                    expandableText: "" + automations[i].name,
                    enableCheckbox: true,
                    editable: true,
                    deletable: true
                });
                list.addItems(item);
                if (automations[i].expires == -1) {
                    item.checkbox.checked = false;
                    item.checkboxLabel.innerText = "(neaktivní)";
                }
                else {
                    if (automations[i].expires < Math.round(Date.now() / 1000)) {
                        item.checkbox.checked = false;
                        item.checkboxLabel.innerText = "(neaktivní)";
                    }
                    else {
                        item.checkbox.checked = true;
                        item.checkboxLabel.innerText = "(aktivní)";
                        let timeDiff = Number.parseInt(automations[i].expires) - Math.round(Date.now() / 1000);
                        setTimeout(() => {
                            item.checkbox.checked = false;
                            item.checkboxLabel.innerText = "(neaktivní)";
                        }, timeDiff * 1000);
                    }
                }
            }
            list.updatedOrderHandler();
        }
    }
    //########################################
    // Přepsané (abstraktní) funkce z předka:
    //########################################
    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    async initPageFromDB() {
        let automations = await Firebase.getDBData("/automations/");
        console.log('data: ', automations);
        let timeoutAutomations = new Array();
        for (const automationID in automations) {
            let automation = automations[automationID];
            if (automation && automation.type == "timeout") {
                timeoutAutomations.push(automation);
            }
        }
        this.automations = automations;
        timeoutAutomations.reverse();
        this.initTimeoutList(timeoutAutomations);
        this.detail.readyToSave = false;
        Loader.hide();
    }
}
AutomationsPage.tagName = "automations-page";
AutomationsPage.DEFAULT_ITEMS_STRING = {
    noItem: [
        "Žádné časovače v databázi. Zkuste nějaké přidat.",
        "Žádné automatizace na základě snímačů v databázi. Zkuste nějaké přidat."
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
