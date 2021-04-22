import { AbstractComponent, IComponentProperties as IComponentProperties } from "../components/component.js";
import { BasePage } from "../pages/base-page.js";
import { AbstractError, BaseConsoleError } from "../errors/base-errors.js";
import { PageAlreadyAddedToPageManagerError, PageNotExistInPageManagerError } from "../errors/page-errors.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";
import { Utils } from "./utils.js";

export class PageManager extends Singleton {
    private activePageIndex: number = 0;
    private activePage: BasePage = null;
    private pages: Array<BasePage>;
    private pagesKeys: Array<string>;
    private pageManagerComponent: PageManagerComponent;

    constructor() {
        super();
        this.pages = new Array();
        this.pagesKeys = new Array();
        this.pageManagerComponent = new PageManagerComponent({});
        AbstractComponent.appendComponentsToDOMElements(document.body, this.pageManagerComponent);
        this.resizePages();
        window.addEventListener('resize', this.resizePages);
    }

    public static getInstance() {
        return <PageManager>super.getInstance();
    }

    addPage(page: BasePage, key: string, forceAdd: boolean = false) {
        if (this.pages.indexOf(page) != -1) {
            //new PageAlreadyAddedToPageManagerError(page, true);            
            console.log("Page (by class) already added to pagemanager: " + page.constructor.name);
            return;
        }
        if (this.pagesKeys.includes(key)) {//Duplicate key in manager
            let i = this.pagesKeys.indexOf(key);
            if (page.constructor.name != this.pages[i].constructor.name) {
                new BaseConsoleError("Already added page with same key!", this, true);
            } else {
                //console.log("Page already added to pagemanager: " + page.constructor.name );
            }
            if (forceAdd) {
                this.pages[i].remove();
                this.pages.splice(i, 1);
                this.pagesKeys.splice(i, 1);
            } else {
                return;
            }
        }

        this.pages.push(page);
        this.pagesKeys.push(key);
        this.pageManagerComponent.appendChild(page);
        if (this.pages.length == 1) {
            this.activePage = page;
            page.style.left = "0px";
        } else {
            page.style.left = <string>Utils.getWindowWidth(true);
            //page.style.display = "none";
        }
    }

    getPageByKey(key: string) {
        return this.pages[this.pagesKeys.indexOf(key)];
    }

    getIndexByKey(key: string) {
        return this.pagesKeys.indexOf(key);
    }

    containsPageKey(key: string) {
        return (this.pagesKeys.indexOf(key) != -1);
    }

    setActive(page: number | string | BasePage, effect: Effects = Effects.NONE) {
        if (typeof page == "number") {
            if (page == this.activePageIndex) {
                return;
            }
            if (page < this.pages.length) {
                if (effect == Effects.SWIPE_TO_LEFT) {
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                    setTimeout(() => { recentActiveStyle.transition = ""; }, Config.defaultTransitionTime)
                    recentActiveStyle.left = "-" + <string>Utils.getWindowWidth(true);

                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.left = <string>Utils.getWindowWidth(true);
                    setTimeout(() => {
                        actualActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                        setTimeout(() => { actualActiveStyle.transition = ""; }, Config.defaultTransitionTime)
                        actualActiveStyle.left = "0px";
                    }, 0);

                } else {
                    this.activePage.style.left = <string>Utils.getWindowWidth(true);

                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    this.activePage.style.left = "0px";
                }
            } else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
                return;
            }
        } else if (typeof page == "string") {
            if (this.containsPageKey(page)) {
                this.activePage.style.left = <string>Utils.getWindowWidth(true);

                this.activePage = this.getPageByKey(page);
                this.activePageIndex = this.getIndexByKey(page);
                this.activePage.style.left = "0px";
            }
        } else {
            if (page == this.activePage) {
                return;
            }
            if (this.pages.indexOf(page) != -1) {

            } else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
                return;
            }
        }
        this.pages.forEach(page => {
            if (page == this.activePage)
                page.style.display = "block";
            else
                page.style.display = "none"

        });

        this.resizePages();
    }

    resizePages = () => {
        let resize = () => {
            this.pageManagerComponent.style.width = <string>Utils.getWindowWidth(true);
            this.pageManagerComponent.style.height = <string>Utils.getWindowHeight(true);
            this.pages.forEach((child, index, array) => {
                let childStyle = (<HTMLElement>child).style;
                childStyle.width = <string>Utils.getWindowWidth(true);
                childStyle.height = <string>Utils.getWindowHeight(true);
                if (index != this.activePageIndex) {
                    childStyle.left = <string>Utils.getWindowWidth(true);
                }
            })
        }
        setTimeout(resize, 1000);
        resize();
    }

}


export class PageManagerComponent extends AbstractComponent {
    static tagName = "page-manager";

    constructor(componentProps?: IComponentProperties) {
        super(componentProps);

    }

}

export enum Effects {
    NONE,
    SWIPE_TO_LEFT,
    SWIPE_TO_RIGHT,
}