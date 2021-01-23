import { Utils } from "../app/utils.js";
import { AbstractComponent, BaseComponent, IComponentProperties } from "../components/component.js";
import { BaseLayout } from "./base-layout.js";
import { HorizontalStack } from "./horizontal-stack.js";

export class TabLayout extends AbstractComponent {
    static tagName = "tab-layout";
    
    active: number = -1;
    tabsRow: HorizontalStack;
    contentRow: HorizontalStack;
    constructor(tabs: ITabsProps[] | null,layoutProps?: IComponentProperties) {
        super(layoutProps);

        this.tabsRow = new HorizontalStack({});

        this.contentRow = new HorizontalStack({height: "100%"});

        if(tabs){
            tabs.forEach(tab => {
                this.addTab(tab.title, tab.container);
            });
            this.setActive(0);
        }

        this.appendComponents([this.tabsRow, this.contentRow]);
    }

    addTab(title: string, content: HTMLElement | AbstractComponent){        
        let tabTitle = new BaseLayout({ innerText: title, classList: "tab"});
        this.tabsRow.pushComponents(tabTitle);
        tabTitle.addEventListener("click", (event)=>{
            this.setActive(Array.from(this.tabsRow.childNodes).indexOf(tabTitle));
        });

        this.contentRow.appendDOMComponents(content);
        content.style.margin = "0";
        content.style.width = "100%";

        if(this.active == -1)
            this.setActive(0);
    }

    setActive(tabIndex: number){        
        this.tabsRow.childNodes.forEach((element, index) => {
            if(index == tabIndex){
                (<HTMLElement>element).classList.add("active");
            }else{
                (<HTMLElement>element).classList.remove("active");
            }
        });
        this.contentRow.childNodes.forEach((element, index) => {
            let display = (index == tabIndex)? "block" : "none";
            (<HTMLElement>element).style.display = display;
        });
    }
    

}

export interface ITabsProps{
    title: string,
    container: HTMLElement
}
