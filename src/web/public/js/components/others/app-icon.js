import { AbstractComponent } from "../component.js";
export class Icon extends AbstractComponent {
    constructor(deviceType, layoutProps) {
        super(layoutProps);
        this.innerHTML = "<img>";
        this.img = this.querySelector("img");
        if (deviceType.startsWith("img/"))
            this.img.src = deviceType;
        else {
            this.img.src = Icon.srcFromName(deviceType);
            this.classList.add(deviceType);
        }
    }
    static srcFromName(name) {
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
Icon.tagName = "app-icon";
