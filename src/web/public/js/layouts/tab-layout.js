import { AbstractComponent, BaseComponent } from "../components/component.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class TabLayout extends AbstractComponent {
    constructor(tabs, layoutProps) {
        super(layoutProps);
        this.tabsRow = new HorizontalStack({});
        this.contentRow = new HorizontalStack({});
        this.tabs = tabs;
        tabs.forEach(tab => {
            let tabTitle = new BaseComponent({ innerText: tab.title, classList: "tab" });
            tabTitle.addEventListener("click", (event) => {
                this.setActive(Array.from(this.tabsRow.childNodes).indexOf(tabTitle));
            });
            this.tabsRow.pushComponents(tabTitle);
            this.contentRow.appendDOMComponents(tab.container);
            tab.container.style.margin = "0";
            if (tab.container.style.borderRadius) {
                let tmpVal = tab.container.style.borderRadius;
                tab.container.style.borderRadius = `0px ${tmpVal} ${tmpVal} ${tmpVal}`;
            }
            tab.container.style.width = "100%";
        });
        this.appendComponents([this.tabsRow, this.contentRow]);
        this.setActive(0);
    }
    setActive(tabIndex) {
        this.tabsRow.childNodes.forEach((element, index) => {
            if (index == tabIndex) {
                element.classList.add("active");
            }
            else {
                element.classList.remove("active");
            }
        });
        this.contentRow.childNodes.forEach((element, index) => {
            let display = (index == tabIndex) ? "block" : "none";
            element.style.display = display;
        });
    }
}
TabLayout.tagName = "tab-layout";
