import { AbstractComponent } from "../components/component.js";
import { Firebase } from "../utils/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
export class RoomCard extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.updateCard = (data) => {
            console.log(this.roomName + ":");
            let outputs = this.getDevices(data.devices);
        };
        this.mainHStack = new HorizontalStack();
        this.sensorStack = new VerticalStack();
        this.devicesStack = new HorizontalStack();
        this.devicesStack.classList.add("devices-stack");
        this.devices = new Array();
        this.roomName = layoutProps.roomName;
        Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard);
        this.mainHStack.appendComponents([this.sensorStack, this.devicesStack]);
        this.appendComponents(this.mainHStack);
    }
    getDevices(devices) {
        let ordered = new Array();
        for (const espName in devices) {
            const out = devices[espName].OUT;
            for (const pin in out) {
                ordered.push(out[pin]);
            }
        }
        ordered.sort((a, b) => (a.index > b.index) ? 1 : -1);
        //console.log('ordered: ', ordered);
        if (this.devices.length == 0) {
            for (const device of ordered) {
                let lamp = new RoomDevice({});
                this.devices.push(lamp);
                this.devicesStack.pushComponent(lamp);
            }
        }
        for (let i = 0; i < this.devices.length; i++) {
            this.devices[i].updateVal(ordered[i].type, ordered[i].value);
        }
    }
}
RoomCard.tagName = "room-card";
export class RoomDevice extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        //this.innerText = initVal.toString();
        this.innerHTML = `
            <div style="position:relative;">
                <div style="position:absolute;top: -50px;left: -16px;width:0px">                    
                    <div class="slidecontainer">
                        <input type="range" min="1" max="1024" value="50" class="slider" style="transform:rotate(90deg); width: 64px">
                    </div>
                </div>                                 
                <div style="position:relative;">
                    <div id="controlled" style="position:absolute;bottom: 0px; height: 16px; overflow:hidden">
                        <img src="img/bulb2.png">
                    </div>
                    <div style="position:relative">
                        <img src="img/bulb.png">
                    </div>
                </div>
            </div>
        `;
        this.controlledByValDiv = this.querySelector("#controlled");
        this.slider = this.querySelector(".slider");
        this.slider.oninput = (event) => {
            if (this.type != undefined) {
                if (this.type == "bool") {
                    let valToSet = (this.slider.value < 512) ? "off" : "on";
                    this.updateVal(this.nodeType, valToSet);
                }
                else if (this.type == "int") {
                    this.updateVal(this.nodeType, this.slider.value);
                }
            }
        };
        //dodelat onmouseup na prepinani pri bool mezi full a empty
    }
    updateVal(type, value) {
        if (this.type == undefined) {
            this.type = type;
        }
        if (type == "bool") {
            if (value == "on") {
                this.controlledByValDiv.style.height = RoomDevice.IMG_HEIGHT + "px";
            }
            else {
                this.controlledByValDiv.style.height = "0px";
            }
        }
        else if (type == "int") {
            if (typeof value == "number") {
                console.log('value: ', value);
                this.controlledByValDiv.style.height = Math.round((value / 1024) * RoomDevice.IMG_HEIGHT) + "px";
            }
        }
    }
}
RoomDevice.tagName = "room-device";
RoomDevice.IMG_HEIGHT = 32;
