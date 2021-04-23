import { ListTypes } from "../layouts/list-component.js";
import { BasePage } from "./base-page.js";
import { Utils } from "../app/utils.js";
import { YesNoCancelDialog } from "../components/dialogs/yes-no-cancel-dialog.js";
import { DialogResponses } from "../components/dialogs/base-dialog.js";
import { EventManager } from "../app/event-manager.js";
import { SettingsPage } from "./settings-page.js";
export class AbstractConfigurationPage extends BasePage {
    //##############################
    // Konec abstraktních funkcí
    //##############################
    constructor(defaultItemTypesIndexes, defaultItemsStrings, componentProps) {
        super(componentProps);
        this.selectedItemsIDHierarchy = new Array(3);
        this._focusDetail = true;
        this.clickPromise = Promise.resolve();
        /**
         * Obsluha události kliknutí na FrameListItem. Funkce slouží pouze jako "obálka" společné funkcionality při kliknutí na FrameListItem,
         * ale volá dále funkci _itemClicked(), kterou si už každý předek musí implementovat sám.
         * @param event Událost
         * @param item Kliknutý FrameListItem
         * @param clickedElem Textový popisek kliknutého elementu v kliknutém FrameListItemu (např. add, delete...). V případě kliknutí mimo konkrétní elementy se předává undefined
         */
        this.itemClicked = async (event, item, clickedElem, clickedByUser) => {
            if (clickedByUser) { // Pokud událost vyvolal uživatel (a ne kód jako reakci na něco), je potřeba hlídat, aby neklikal "zběsile", jinak může docházet k chybám při skládání UI
                await this.clickPromise;
                this.clickPromise = new Promise((resolve, reject) => { this.clickPromiseResolver = resolve; });
            }
            try {
                let cancelChanges = await this.showSaveDialog();
                if (cancelChanges) {
                    if (this.clickPromiseResolver)
                        this.clickPromiseResolver();
                    return;
                }
                if (!item.isConnected) { // V některých případech je (zejména při "zběsilém" klikání) potřeba odfiltrovat kliknutí na prvky, které ale mezitím již byly odstraněny z DOM stromu
                    if (this.clickPromiseResolver)
                        this.clickPromiseResolver();
                    return;
                }
                let parentList = this.getItemsList(item);
                if (clickedElem == undefined || clickedElem == "edit") {
                    /**
                     * Pokud se jedná o SettingsPage a typ seznamu pro snímače, nebo zařízení, tak chceme všechny nastavit jako neaktivní z obou seznamů,
                     * protože jsou (hierarchicky) na stejné úrovni a nechceme položky v tom "druhém" listu nechávat aktivní
                     */
                    if (this instanceof SettingsPage && Utils.itemIsAnyFromEnum(parentList.type, ListTypes, ["SENSORS", "DEVICES"])) {
                        this.sensorsList.getItems().items.forEach(listItem => {
                            listItem.active = false;
                        });
                        this.devicesList.getItems().items.forEach(listItem => {
                            listItem.active = false;
                        });
                    }
                    else { // Jinak ve všech ostatních případech chceme odstarnit aktivní stav pouze ze všech položek aktuálního seznamu
                        parentList.getItems().items.forEach(listItem => {
                            listItem.active = false;
                        });
                    }
                    item.active = true; // Samozřejmě nakonec aktuálně zvolenou položku opět přepneme na aktivní
                    this.itemInDetail = { item: item, parentListType: parentList.type };
                    this.initDetail();
                    if (this._focusDetail) {
                        this.detail.scrollIntoView();
                        this.detail.blink(1);
                    }
                }
                this._itemClicked(parentList, event, item, clickedElem, clickedByUser);
            }
            finally {
                if (this.clickPromiseResolver)
                    this.clickPromiseResolver();
            }
        };
        /**
         * Pokud jsou v detailu nějaké změny, zobrazí dialog na uložení změn.
         */
        this.showSaveDialog = async () => {
            let dialog = new YesNoCancelDialog("V detailu máte rozpracované změny. <br>Uložit změny?");
            if (this.detail.readyToSave) {
                let ans = await dialog.show();
                if (ans == DialogResponses.YES) {
                    this.saveChanges(null);
                }
                else if (ans == DialogResponses.NO) {
                    this.initDetail();
                    this.detail.readyToSave = false;
                }
                else {
                    EventManager.dispatchEvent("changesCanceled");
                    return true;
                }
            }
            EventManager.dispatchEvent("changesSaved");
            return false;
        };
        this.defaultItemTypesIndexes = defaultItemTypesIndexes;
        this.defaultItemsStrings = defaultItemsStrings;
        this.allListComponents = new Array();
        document.addEventListener("click", async (e) => {
            let path = e.path.map((element) => {
                return (element.localName) ? element.localName : "";
            });
            if (path.includes("menu-icon") || path.includes("menu-item")) {
                await this.showSaveDialog();
            }
        });
    }
    /**
     * Funkce na stránce vybere (aktivuje) položku ze seznamů na stránce na základě její ID z databáze
     * @param dbID ID položky z databze, kterou chceme na stránce vybrat
     * @param timeLimit Maximální časový limit pro výběr položky (pro případ, že se na stránce nenalézá, nebo UI ještě není plně sestaveno a může tedy výběr "chvíli" trvat)
     */
    async selectItemOnPageByDBID(dbID, timeLimit = 1000) {
        try {
            let anyItem = await this.getItemByDBID(dbID, timeLimit);
            await this.itemClicked(null, anyItem);
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Funkce na stránce najde položku ze seznamů na stránce na základě její ID z databáze
     * @param dbID ID položky z databze, kterou chceme na stránce vyhledat
     * @param timeLimit Maximální časový limit pro hledání položky (pro případ, že se na stránce nenalézá, nebo UI ještě není plně sestaveno a může tedy hledáni "chvíli" trvat)
     */
    async getItemByDBID(dbID, timeLimit = 1000) {
        let anyItem = undefined;
        let sleep = undefined;
        let sleepTime = 10;
        let cycle = 0;
        while (!anyItem && (++cycle * sleepTime) <= timeLimit) { // When this method is called more than one (selecting next items in hierarchy), we need some delay to build DOM tree, so we check if item was found and if not, wait for little bit of time and try again.
            for (const list of this.allListComponents) {
                anyItem = anyItem || list.getItems().items.find((value, index, array) => {
                    return value.dbCopy.dbID == dbID;
                });
            }
            if (!anyItem) {
                await new Promise(resolve => sleep = setTimeout(resolve, sleepTime));
            }
        }
        if (!anyItem)
            return Promise.reject("Time limit of " + (timeLimit / 1000) + " seconds expired!");
        return anyItem;
    }
    /**
     * Najde a vrátí komponentu List (seznam), která je pro danou položku (item) nadřezeným seznamem
     * @param item Položka, pro kterou hledáme nadřazený seznam
     */
    getItemsList(item) {
        let lists = this.allListComponents;
        let list;
        lists.forEach((l) => {
            let tmpIndex = l.getItemIndex(item);
            if (tmpIndex != -1) {
                list = l;
            }
        });
        return list;
    }
    /**
     * Funkce vrátí řetězec pro titulek detailu na základě typu předané položky a názvu editovaného objektu
     * @param item Položka, pro kterou hledáme titulek
     * @param name Název objektu
     * @returns Řetězec pro titulek detailu na základě typu předané položky a jména editovaného objektu ve formátu "Editujete *typ-objektu* name"
     */
    getTitleForEditingFromItem(item, name) {
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
            case ListTypes.TIMEOUT:
                title += 'časovač ';
                break;
            case ListTypes.SENSORS_AUTOMATIONS:
                title += 'automatizace ';
                break;
            default:
                title += '??? ';
        }
        title += '"' + name + '"';
        return title;
    }
    /**
     * Funkce uloží pro zvolenou položku její ID z databáze do pole selectedItemsIDHierarchy. Tohoto pole se později používá např. při reinicializaci stránky (pro postupné zvolení položek, které byli již zvoleny)
     * @param parentList Nadřazený list pro danou položku
     * @param item Položka, které ID ukládáme
     */
    saveNewlySelectedItemIDToSelectedItemsIDHierarchy(parentList, item) {
        let index = 0; //default 0 = ROOMS
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
        if (index < 2) //remove subordinate active items from selectedItemsIDHierarchy - eg. if we save new room, we don't want to keep old modules, sensors and devices list...
            this.selectedItemsIDHierarchy.splice(index + 1);
    }
    /**
     * Načte stránku znovu (vč. obnovení dat z databáze). Postará se i zvolení jednotlivých položek, které byli zvoleny.
     * Volá se např. při přidání položky do nějakého seznamu. Tehdy je totiž potřeba stránku znovu načíst (pro aktuální data).
     */
    async pageReinicialize() {
        await this.initPageFromDB();
        this.detail.initialize(this.saveChanges, this.initDetail);
        await this.selectSavedIDs();
    }
    /**
     * Funkce na stránce zvolí postupně položky všech seznamů, které "mají být" zvoleny (které byli např. před reinicializací stránky)
     */
    async selectSavedIDs() {
        let tmpSelectedIDs = [...this.selectedItemsIDHierarchy]; // Method selectItemByID (which is called from this forEach) mainpulates with selectedItemsIDHierarchy array, so we need to work with copy
        for (let i = 0; i < tmpSelectedIDs.length; i++) {
            let id = tmpSelectedIDs[i];
            if (id) {
                try {
                    await this.selectItemOnPageByDBID(id);
                }
                catch (error) {
                    this.selectedItemsIDHierarchy.splice(i, this.selectedItemsIDHierarchy.length - i);
                    break;
                }
            }
        }
    }
    /**
     * Funkce vrátí index hlášky pro výchozí položku seznamu
     * @param type Typ položky pro identifikaci seznamu
     * @returns Index hlášky pro výchozí položku seznamu
     */
    itemTypeToDefaultTypeIndex(type) {
        return this.defaultItemTypesIndexes[ListTypes[type]];
    }
    /**
     * Funkce vrátí hlášku pro výchozí položku seznamu
     * @param type Typ položky pro identifikaci seznamu
     * @param noItem Rozhoduje, zda se má brát hláška pro neexistující záznam z databáze, nebo hláška říkající, že je potřeba nejprve vybrat něco z nadřazeného seznamu
     * @returns Hlášku pro výchozí položku seznamu
     */
    itemTypeToDefItmStr(type, noItem = false) {
        if (noItem) {
            return this.defaultItemsStrings.noItem[this.itemTypeToDefaultTypeIndex(type)];
        }
        else {
            return this.defaultItemsStrings.choseItem[this.itemTypeToDefaultTypeIndex(type)];
        }
    }
}
AbstractConfigurationPage.tagName = "settings-page";
