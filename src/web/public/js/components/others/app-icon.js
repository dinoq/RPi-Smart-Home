import { AbstractComponent } from "../component.js";
export class Icon extends AbstractComponent {
    constructor(iconName, layoutProps) {
        super(layoutProps);
        this.innerHTML = "<img>";
        this.img = this.querySelector("img");
        if (iconName.startsWith("img/icons/"))
            this.img.src = iconName;
        else {
            this.img.src = `img/icons/${iconName}.png`;
            this.classList.add(iconName);
        }
    }
}
Icon.tagName = "app-icon";
