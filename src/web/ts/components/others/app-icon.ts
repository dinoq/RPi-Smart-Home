import { AbstractComponent, IComponentProperties } from "../component.js";

export class Icon extends AbstractComponent {
    static tagName = "app-icon";
    img: HTMLImageElement;

    constructor(iconName: string, layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.innerHTML = "<img>";
        this.img = this.querySelector("img");
        if (iconName.startsWith("img/icons/"))
            this.img.src = iconName;
        else{
            this.img.src = `img/icons/${iconName}.png`;
            this.classList.add(iconName);
        }
    }

}