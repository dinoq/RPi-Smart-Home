import { AbstractComponent } from "../components/page-component.js";
import { PageAlreadyAddedToPageManagerError, PageNotExistInPageManagerError } from "../errors/page-errors.js";
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
        this.pageManagerComponent = new PageManagerComponent({});
        this.resizePages();
        window.addEventListener('resize', this.resizePages);
    }
    connect() {
        this.pageManagerComponent.connectComponent(document.body);
    }
    addPage(page) {
        if (this.pages.indexOf(page) != -1) {
            new PageAlreadyAddedToPageManagerError(page, true);
            return;
        }
        this.pages.push(page);
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
    setActive(page, effect = Effects.NONE) {
        if (typeof page == "number") {
            if (page < this.pages.length) {
                let transitionTime = 1;
                if (effect == Effects.SWIPE_TO_LEFT) {
                    let recentActiveStyle = this.activePage.style;
                    recentActiveStyle.transition = "left " + transitionTime + "s";
                    setTimeout(() => { recentActiveStyle.transition = ""; }, transitionTime * 1000);
                    recentActiveStyle.left = "-" + Config.getWindowWidth(true);
                    this.activePage = this.pages[page];
                    this.activePageIndex = page;
                    let actualActiveStyle = this.activePage.style;
                    actualActiveStyle.transition = "left " + transitionTime + "s";
                    setTimeout(() => { actualActiveStyle.transition = ""; }, transitionTime * 1000);
                    actualActiveStyle.left = "0px";
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
        else {
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
        this.style.position = "absolute";
        this.style.top = "0";
        this.style.left = "0";
    }
}
export var Effects;
(function (Effects) {
    Effects[Effects["NONE"] = 0] = "NONE";
    Effects[Effects["SWIPE_TO_LEFT"] = 1] = "SWIPE_TO_LEFT";
    Effects[Effects["SWIPE_TO_RIGHT"] = 2] = "SWIPE_TO_RIGHT";
})(Effects || (Effects = {}));
