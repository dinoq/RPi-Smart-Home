import { AbstractComponent } from "../components/component.js";
import { BaseLayout } from "./base-layout.js";
import { HorizontalStack } from "./horizontal-stack.js";
export class TabLayout extends AbstractComponent {
    constructor(tabs, layoutProps) {
        super(layoutProps);
        this.active = -1;
        this.tabsRow = new HorizontalStack({});
        this.contentRow = new HorizontalStack({ height: "100%" });
        if (tabs) {
            tabs.forEach(tab => {
                this.addTab(tab.title, tab.container);
            });
            this.setActive(0);
        }
        this.appendComponents([this.tabsRow, this.contentRow]);
    }
    addTab(title, content) {
        let tabTitle = new BaseLayout({ innerText: title, classList: "tab" });
        this.tabsRow.pushComponents(tabTitle);
        tabTitle.addEventListener("click", (event) => {
            this.setActive(Array.from(this.tabsRow.childNodes).indexOf(tabTitle));
        });
        this.contentRow.appendDOMComponents(content);
        content.style.margin = "0";
        content.style.width = "100%";
        if (this.active == -1)
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
