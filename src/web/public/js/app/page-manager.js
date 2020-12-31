import { AbstractComponent } from "../components/component.js";
import { BaseError } from "../errors/base-error.js";
import { PageNotExistInPageManagerError } from "../errors/page-errors.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";
export class PageManager extends Singleton {
    constructor() {
        super();
        this.activePageIndex = 0;
        this.activePage = null;
        this.resizePages = () => {
            this.pageManagerComponent.style.width = Config.getWindowWidth(true);
            this.pageManagerComponent.style.height = Config.getWindowHeight(true);
            this.pages.forEach((child, index, array) => {
                let childStyle = child.style;
                childStyle.width = Config.getWindowWidth(true);
                childStyle.height = Config.getWindowHeight(true);
                if (index != this.activePageIndex) {
                    childStyle.left = Config.getWindowWidth(true);
                }
            });
        };
        this.pages = new Array();
        this.pagesKeys = new Array();
        this.pageManagerComponent = new PageManagerComponent({});
        AbstractComponent.appendComponentsToDOMElements(document.body, this.pageManagerComponent);
        this.resizePages();
        window.addEventListener('resize', this.resizePages);
    }
    addPage(page, key) {
        if (this.pages.indexOf(page) != -1) {
            //new PageAlreadyAddedToPageManagerError(page, true);            
            console.log("Page (by class) already added to pagemanager: " + page.constructor.name);
            return;
        }
        if (this.pagesKeys.includes(key)) { //Duplicate key in manager
            let i = this.pagesKeys.indexOf(key);
            if (page.constructor.name != this.pages[i].constructor.name) {
                new BaseError("Already added page with same key!", this, true);
            }
            else {
                //console.log("Page already added to pagemanager: " + page.constructor.name );
            }
            return;
        }
        this.pages.push(page);
        this.pagesKeys.push(key);
        this.pageManagerComponent.appendChild(page);
        if (this.pages.length == 1) {
            this.activePage = page;
            page.style.left = "0px";
        }
        else {
            page.style.left = Config.getWindowWidth(true);
            //page.style.display = "none";
        }
    }
    getPageByKey(key) {
        return this.pages[this.pagesKeys.indexOf(key)];
    }
    getIndexByKey(key) {
        return this.pagesKeys.indexOf(key);
    }
    containsPageKey(key) {
        return (this.pagesKeys.indexOf(key) != -1);
    }
    setActive(page, effect = Effects.NONE) {
        if (typeof page == "number") {
            if (page == this.activePageIndex) {
                return;
            }
            if (page < this.pages.length) {
                if (effect == Effects.SWIPE_TO_LEFT) {
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                    setTimeout(() => { recentActiveStyle.transition = ""; }, Config.defaultTransitionTime);
                    recentActiveStyle.left = "-" + Config.getWindowWidth(true);
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.left = Config.getWindowWidth(true);
                    setTimeout(() => {
                        actualActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                        setTimeout(() => { actualActiveStyle.transition = ""; }, Config.defaultTransitionTime);
                        actualActiveStyle.left = "0px";
                    }, 0);
                }
                else {
                    this.activePage.style.left = Config.getWindowWidth(true);
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    this.activePage.style.left = "0px";
                }
            }
            else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        }
        else if (typeof page == "string") {
            if (this.containsPageKey(page)) {
                this.activePage.style.left = Config.getWindowWidth(true);
                this.activePage = this.getPageByKey(page);
                this.activePageIndex = this.getIndexByKey(page);
                this.activePage.style.left = "0px";
            }
        }
        else {
            if (page == this.activePage) {
                return;
            }
            if (this.pages.indexOf(page) != -1) {
            }
            else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        }
    }
}
export class PageManagerComponent extends AbstractComponent {
    constructor(componentProps) {
        super(componentProps);
    }
}
PageManagerComponent.tagName = "page-manager";
export var Effects;
(function (Effects) {
    Effects[Effects["NONE"] = 0] = "NONE";
    Effects[Effects["SWIPE_TO_LEFT"] = 1] = "SWIPE_TO_LEFT";
    Effects[Effects["SWIPE_TO_RIGHT"] = 2] = "SWIPE_TO_RIGHT";
})(Effects || (Effects = {}));
