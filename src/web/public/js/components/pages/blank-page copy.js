import { BasePage } from "./base-page.js";
export class BlankPage extends BasePage {
    constructor(componentProps) {
        super(componentProps);
        this.innerHTML = "<div style='display:flex;justify-content: center;'><h1>" + componentProps.title + "</h1></div>";
    }
}
