import { AbstractComponent, IComponentProperties } from "../component.js";

export class Icon extends AbstractComponent {
    static tagName = "app-icon";
    img: HTMLImageElement;

    constructor(icon: string, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.innerHTML = "<img>";
        this.img = this.querySelector("img");
        if (icon.startsWith("img/"))
            this.img.src = icon;
        else{
            this.img.src = Icon.srcFromName(icon);
            this.classList.add(icon);
        }

    }

    static srcFromName(name: string) {
        switch (name) {
            case "temp": return "img/icons/temp.png";
            case "humidity": return "img/icons/humidity.png";
            case "switch": return "img/icons/temp.png";
            case "edit": return "img/icons/edit.png";
            case "delete": return "img/icons/delete.png";
            default: return "";
        }
    }
}