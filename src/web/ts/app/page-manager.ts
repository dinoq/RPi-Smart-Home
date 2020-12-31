import { AbstractComponent, IComponentProperties as IComponentProperties } from "../components/component.js";
import { BasePage } from "../pages/base-page.js";
import { BaseError } from "../errors/base-error.js";
import { PageAlreadyAddedToPageManagerError, PageNotExistInPageManagerError } from "../errors/page-errors.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";

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

    addPage(page: BasePage, key: string) {
        if (this.pages.indexOf(page) != -1) {
            //new PageAlreadyAddedToPageManagerError(page, true);            
            console.log("Page (by class) already added to pagemanager: " + page.constructor.name );
            return;
        }
        if(this.pagesKeys.includes(key)){//Duplicate key in manager
            let i = this.pagesKeys.indexOf(key);
            if(page.constructor.name != this.pages[i].constructor.name){
                new BaseError("Already added page with same key!", this, true);
            }else{
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
        } else {
            page.style.left = <string>Config.getWindowWidth(true);
            //page.style.display = "none";
        }
    }

    getPageByKey(key: string){
        return this.pages[this.pagesKeys.indexOf(key)];
    }

    getIndexByKey(key: string){
        return this.pagesKeys.indexOf(key);
    }

    containsPageKey(key:string){
        return (this.pagesKeys.indexOf(key) != -1);
    }

    setActive(page: number | string | BasePage, effect: Effects = Effects.NONE) {
        if (typeof page == "number") {
            if(page == this.activePageIndex){
                return;
            }
            if (page < this.pages.length) {
                if(effect == Effects.SWIPE_TO_LEFT){
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                    setTimeout(()=>{recentActiveStyle.transition="";}, Config.defaultTransitionTime)
                    recentActiveStyle.left = "-" + <string>Config.getWindowWidth(true);
    
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.left = <string>Config.getWindowWidth(true);
                    setTimeout(()=>{
                        actualActiveStyle.transition = "left " + Config.defaultTransitionTime + "ms";
                        setTimeout(()=>{actualActiveStyle.transition="";}, Config.defaultTransitionTime)
                        actualActiveStyle.left = "0px";
                    },0);

                }else{
                    this.activePage.style.left = <string>Config.getWindowWidth(true);
    
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    this.activePage.style.left = "0px";
                }
            } else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        } else if(typeof page == "string"){
            if(this.containsPageKey(page)){
                this.activePage.style.left = <string>Config.getWindowWidth(true);

                this.activePage = this.getPageByKey(page);
                this.activePageIndex = this.getIndexByKey(page);
                this.activePage.style.left = "0px";
            }
        } else {
            if(page == this.activePage){
                return;
            }
            if (this.pages.indexOf(page) != -1) {

            } else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        }
    }

    resizePages = () => {
        this.pageManagerComponent.style.width = <string>Config.getWindowWidth(true);
        this.pageManagerComponent.style.height = <string>Config.getWindowHeight(true);
        this.pages.forEach((child, index, array) => {
            let childStyle = (<HTMLElement>child).style;
            childStyle.width = <string>Config.getWindowWidth(true);
            childStyle.height = <string>Config.getWindowHeight(true);
            if (index != this.activePageIndex) {
                childStyle.left = <string>Config.getWindowWidth(true);
            }
        })
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