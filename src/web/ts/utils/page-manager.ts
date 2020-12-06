import { AbstractComponent, componentProperties } from "../components/page-component.js";
import { BasePage } from "../components/pages/base-page.js";
import { PageAlreadyAddedToPageManagerError, PageNotExistInPageManagerError } from "../errors/page-errors.js";
import { Config } from "./config.js";
import { Singleton } from "./singleton.js";

export class PageManager extends Singleton {
    private activePageIndex: number = 0;
    private activePage: BasePage = null;
    private pages: Array<BasePage>;
    private pageManagerComponent: PageManagerComponent;

    constructor() {
        super();
        this.pages = new Array();
        this.pageManagerComponent = new PageManagerComponent({});
        this.resizePages();
        window.addEventListener('resize', this.resizePages);
    }

    connect() {
        this.pageManagerComponent.connectComponent(document.body);
    }
    addPage(page: BasePage) {
        if (this.pages.indexOf(page) != -1) {
            new PageAlreadyAddedToPageManagerError(page, true);
            return;
        }
        this.pages.push(page);
        this.pageManagerComponent.appendChild(page);
        if (this.pages.length == 1) {
            this.activePage = page;
            page.style.left = "0px";
        } else {
            page.style.left = <string>Config.getWindowWidth(true);
            //page.style.display = "none";
        }
    }

    setActive(page: number | BasePage, effect: Effects = Effects.NONE) {
        if (typeof page == "number") {
            if (page < this.pages.length) {
                let transitionTime = 1;
                if(effect == Effects.SWIPE_TO_LEFT){
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + transitionTime + "s";
                    setTimeout(()=>{recentActiveStyle.transition="";}, transitionTime * 1000)
                    recentActiveStyle.left = "-" + <string>Config.getWindowWidth(true);
    
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.transition = "left " + transitionTime + "s";
                    setTimeout(()=>{actualActiveStyle.transition="";}, transitionTime * 1000)
                    actualActiveStyle.left = "0px";

                }else{
                    this.activePage.style.left = <string>Config.getWindowWidth(true);
    
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    this.activePage.style.left = "0px";
                }
            } else {
                new PageNotExistInPageManagerError(page, this.pages.length, true);
            }
        } else {
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
    constructor(componentProps: componentProperties) {
        super(componentProps);
        this.style.position = "absolute";
        this.style.top = "0";
        this.style.left = "0";

    }

}

export enum Effects {
    NONE,
    SWIPE_TO_LEFT,
    SWIPE_TO_RIGHT,
}