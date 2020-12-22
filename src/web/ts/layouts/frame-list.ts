import { AbstractComponent, BaseComponent, componentProperties } from "../components/component.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";


export class FrameList extends AbstractComponent {
    static tagName = "frame-list";
    
    private itemContainer: HTMLTableElement;
    constructor(layoutProps?: componentProperties) {
        super(layoutProps);
        
        this.itemContainer = <HTMLTableElement>document.createElement("table");

        this.appendComponents(<AbstractComponent><unknown>this.itemContainer);
    }
    
    clearItems() {
        this.itemContainer.innerHTML = "";
    }
    
    addItems(components: FrameListItem | FrameListItem[]){
        
        //this.itemContainer.pushComponents(<AbstractComponent><unknown>components);
    }

    frmListItemToTableRow(item: FrameListItem){
        
    }

}


export class FrameListItem extends AbstractComponent {
    static tagName = "frame-list-item";
    
    private layout: HorizontalStack;
    constructor(roomName: string, showArrows, layoutProps?: componentProperties) {
        super(layoutProps);

        this.layout = new HorizontalStack();

        if(showArrows.up){
            let up = new BaseComponent({innerText: "▶", transform: "rotate(-90deg)"});
            console.log("UP", up.clientWidth);
            this.layout.pushComponents(up);
        }
        if(showArrows.down){
            let down = new BaseComponent({innerText: "▶", transform: "rotate(90deg)"});
            this.layout.pushComponents(down);
        }

        let name = new BaseComponent({innerText: roomName });
        this.layout.pushComponents(name);

        this.appendComponents(this.layout);
    }
    

}
