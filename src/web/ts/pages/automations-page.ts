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
import { AutomationDetail } from "../layouts/automation-detail.js";
import { AbstractConfigurationPage } from "./abstract-configuration-page.js";
export class AutomationsPage extends AbstractConfigurationPage {
    static tagName = "automations-page";

    private timeoutAutomationsList: List;
    private sensorAutomationsList: List;

    timeoutAutomationsTabPanel: TabLayout;
    private sensorAutomationsTabPanel: TabLayout;
    protected detail: BaseDetail;
    automations: any[];


    static DEFAULT_ITEMS_STRING = {
        noItem: [
            "Žádné časovače v databázi. Zkuste nějaké přidat.",
            "Žádné automatizace na základě snímačů v databázi. Zkuste nějaké přidat."
        ],
        choseItem: [
            "Vyčkejte, načítají se data z databáze",
            "Vyčkejte, načítají se data z databáze"
        ]
    };


    constructor(componentProps?: IComponentProperties) {
        super(defaultItemTypesIndexes, AutomationsPage.DEFAULT_ITEMS_STRING, componentProps);
        this.detail = new AutomationDetail(this.saveChanges, this.initDetail);

        this.timeoutAutomationsTabPanel = new TabLayout(null);
        this.sensorAutomationsTabPanel = new TabLayout(null);

        this.timeoutAutomationsList = new List({
            type: ListTypes.TIMEOUT,
            addBtnCallback: this.itemClicked
        });
        this.timeoutAutomationsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.TIMEOUT));
        this.allListComponents.push(this.timeoutAutomationsList)

        this.sensorAutomationsList = new List({
            type: ListTypes.SENSORS_AUTOMATIONS,
            addBtnCallback: this.itemClicked
        });
        this.sensorAutomationsList.initDefaultItem(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.SENSORS_AUTOMATIONS));
        this.allListComponents.push(this.sensorAutomationsList)


        this.timeoutAutomationsTabPanel.addTab("Časovače", this.timeoutAutomationsList);
        this.sensorAutomationsTabPanel.addTab("Automatizace na základě snímačů", this.sensorAutomationsList);


        this.appendComponents([this.timeoutAutomationsTabPanel, this.sensorAutomationsTabPanel, this.detail]);
        
        try {
            Loader.show();
            this.initPageFromDB();            
        } catch(err) {
            Loader.hide();
        }


        document.addEventListener("click", async (e) => {
            let path = (<any>e).path.map((element) => {
                return (element.localName) ? element.localName : "";
            })
            if (path.includes("menu-icon") || path.includes("menu-item")) {
                await this.showSaveDialog();
            }
        });
    }

    
    initTimeoutList(automations: any[]) {
        let list = this.timeoutAutomationsList;
        list.clearItems();
        list.updateAddItemBtn("/automations/");
        
        console.log('automations: ', automations);
        if (!automations.length) {
            //list.defaultItem.initialize(ListTypes.TEXT_ONLY, this.itemTypeToDefItmStr(ListTypes.TIMEOUT, true));
            list.defaultItem.initializeItem({
                type: ListTypes.TEXT_ONLY,
                expandableText: this.itemTypeToDefItmStr(ListTypes.TIMEOUT, true)
            })
            list.addItems(list.defaultItem);
        } else {
            for (let i = 0; i < automations.length; i++) {
                let bottom = (i != (automations.length - 1)) ? "1px solid var(--default-blue-color)" : "none";
                let item = new ListItem({ borderBottom: bottom });
                automations[i]["path"] = "automations/" + automations[i].dbID;
                //item.initialize(ListTypes.ROOMS, this.itemClicked, timeoutAutomations[i], timeoutAutomations[i].name, { up: (i != 0), down: (i != (timeoutAutomations.length - 1)) });
                item.initializeItem({
                    type: ListTypes.TIMEOUT,
                    onClickCallback: this.itemClicked,
                    dbCopy: automations[i], 
                    expandableText: ""+automations[i].name, 
                    enableCheckbox: true,
                    editable: true, 
                    deletable: true
                })
                list.addItems(item);
                if(automations[i].expires == -1){
                    item.checkbox.checked = false;
                    item.checkboxLabel.innerText = "(neaktivní)"
                }else{                    
                    if(automations[i].expires < Math.round(Date.now()/1000)){
                        item.checkbox.checked = false;
                        item.checkboxLabel.innerText = "(neaktivní)"
                    }else{
                        item.checkbox.checked = true;
                        item.checkboxLabel.innerText = "(aktivní)"
                        let timeDiff = Number.parseInt(automations[i].expires) - Math.round(Date.now()/1000);
                        setTimeout(()=>{
                            item.checkbox.checked = false;
                            item.checkboxLabel.innerText = "(neaktivní)"
                        }, timeDiff * 1000)
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
            if(automation && automation.type == "timeout"){
                timeoutAutomations.push(automation);
            }
        }
        this.automations = automations;

        timeoutAutomations.reverse();
        this.initTimeoutList(timeoutAutomations);

        this.detail.readyToSave = false;
        Loader.hide();
    }

    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    saveChanges = async (event) => {

    }    

    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
    initDetail = () => {

        let item = this.itemInDetail.item;
        let parentListType = this.itemInDetail.parentListType;
        let title = this.getTitleForEditingFromItem(item, item.dbCopy.name);
        let values: Array<IDetailRowInitObject> = new Array();
        if (parentListType == ListTypes.TIMEOUT) {
            values = [
                { selectedValue: item.dbCopy.name },
                { selectedValue: "TODOOOO" }
            ]
        }
        this.detail.updateDetail(title, parentListType, values);
    }

    /**
     * Komentář viz. předek (AbstractConfigurationPage)
     */
     _itemClicked = async (parentList: List, event, item: ListItem, clickedElem?: string, clickedByUser?: boolean) => {
        console.log('clickedByUser: ', clickedByUser);
        console.log('clickedElem: ', clickedElem);
        console.log('item.dbCopy: ', item.dbCopy);

        if (clickedElem == "add") {// Add item to database
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
            let newItem: ListItem = <ListItem>parentList.getItems().items[0];

            await this.itemClicked(null, newItem, "edit");

            this._focusDetail = true;


        }
    }
    //##############################
    // Konec abstraktních funkcí
    //##############################

}

enum defaultItemTypesIndexes {
    TIMEOUT,
    SENSORS_AUTOMATIONS
};
