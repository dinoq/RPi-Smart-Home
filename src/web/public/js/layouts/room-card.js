import { AbstractComponent } from "../components/component.js";
import { Firebase } from "../utils/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
export class RoomCard extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.sliderActiveFor = null;
        this.updateCard = (data) => {
            console.log(this.roomName + ":");
            let outputs = this.getDevices(data.devices);
        };
        this.changeSliderVisibility = (val, caller) => {
            let inputElem = this.slider.querySelector("input");
            if (this.sliderActiveFor == caller) {
                inputElem.style.display = "none";
                this.sliderActiveFor = null;
                caller.toggleNameColor();
            }
            else {
                if (this.sliderActiveFor)
                    this.sliderActiveFor.toggleNameColor();
                caller.toggleNameColor();
                inputElem.style.display = "inline-block";
                inputElem.value = val;
                this.sliderActiveFor = caller;
            }
        };
        this.sliderChanged = (value, mouseUp = false) => {
            if (this.sliderActiveFor != null) {
                //this.sliderActiveFor.updateVal(value); NOT SET VALUE DIRECTLY, BUT CALL FIREBASE TO UPDATE VALUE, AND FIREBASE (BECAUSE OF VALUE LISTENER) WILL NOTICE DEVICE WHICH CHANGED
                let dev = this.sliderActiveFor;
                Firebase.updateDBData(dev.devicePath, { value: dev.convertNumToDBVal(value) });
            }
            if (mouseUp && this.sliderActiveFor.type == "bool") {
                let inputElem = this.slider.querySelector("input");
                inputElem.value = (value < 512) ? "0" : "1024";
            }
        };
        this.mainHStack = new HorizontalStack();
        this.sensorStack = new VerticalStack();
        this.rightStack = new VerticalStack({
            "flex-direction": "column-reverse",
            "padding": "40px 0"
        });
        this.rightStack.classList.add("right-stack");
        this.slider = new Slider();
        this.slider.initialize(this.sliderChanged);
        this.devicesStack = new HorizontalStack({
            "justify-content": "space-evenly"
        });
        this.devices = new Array();
        this.roomName = layoutProps.roomName;
        Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard);
        this.rightStack.appendComponents([this.devicesStack, this.slider]);
        this.mainHStack.appendComponents([this.sensorStack, this.rightStack]);
        this.appendComponents(this.mainHStack);
    }
    getDevices(devices) {
        let ordered = new Array();
        for (const espName in devices) {
            const out = devices[espName].OUT;
            for (const pin in out) {
                out[pin].path = "/rooms/" + this.roomName + "/devices/" + espName + "/OUT/" + pin;
                ordered.push(out[pin]);
            }
        }
        ordered.sort((a, b) => (a.index > b.index) ? 1 : -1);
        console.log('ordered: ', ordered);
        if (this.devices.length == 0) {
            for (const device of ordered) {
                let lamp = new RoomDevice({});
                this.devices.push(lamp);
                this.devicesStack.pushComponent(lamp);
            }
        }
        for (let i = 0; i < this.devices.length; i++) {
            if (!this.devices[i].initialized) {
                this.devices[i].initialize(i, ordered, this.changeSliderVisibility);
            }
            this.devices[i].updateVal(ordered[i].value);
            if (this.devices[i] == this.sliderActiveFor) {
                let val = ordered[i].value;
                if (ordered[i].type == "bool") {
                    val = (ordered[i].value == "on") ? 1024 : 0;
                }
                this.slider.querySelector("input").value = val;
            }
        }
    }
}
RoomCard.tagName = "room-card";
export class Slider extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.innerHTML = `               
            <input type="range" min="1" max="1024" value="512" class="slider" style="width: 100%; display:none">
        `;
    }
    initialize(sliderChanged) {
        let element = this.querySelector("input");
        element.oninput = () => {
            sliderChanged(element.value);
        };
        element.onmouseup = () => {
            sliderChanged(element.value, true);
        };
    }
}
Slider.tagName = "slider-component";
export class RoomDevice extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.initialized = false;
        this.value = 0;
        //this.innerText = initVal.toString();
        this.innerHTML = `
            <div style="position:relative;">    
                <div class="device-name" style="position:absolute;width: max-content;">
                   Nazev
                </div>  
                <div class="bg-image" style="position:absolute;height: 16px;bottom: 0px;overflow: hidden;">
                    <img src="img/bulb2.png">
                </div> 
                <div style="position:relative;display: flex;justify-content: center;">
                    <img src="img/bulb.png">
                </div>
                
            </div>
        `;
        this.style.display = "flex";
        this.style.width = "150px";
        this.style.justifyContent = "center";
        this.bgImage = this.querySelector(".bg-image");
        /*
                <div style="position:absolute;top: 0px;left: 0px;width:0px">
                    Nazev
                </div>*/
        /*this.controlledByValDiv = this.querySelector("#controlled");
        this.slider = this.querySelector(".slider");
        
        this.slider.oninput=(event)=>{
            if(this.type != undefined){
                let valToSet = this.slider.value;
                if(this.type=="bool"){
                    valToSet = (this.slider.value < 512)? "off" : "on";
                }
                this.updateVal(valToSet);
                let updates = {};
                updates["/"+Firebase.getFullPath(this.devicePath)+"/value"] = "offf";
                Firebase.updateDBData(this.devicePath, {value: valToSet});
            }
        }*/
        //dodelat onmouseup na prepinani pri bool mezi full a empty??
    }
    initialize(index, object, onClickCallback) {
        this.type = object[index].type;
        this.devicePath = object[index].path;
        this.initialized = true;
        this.addEventListener('click', () => {
            onClickCallback(this.value, this);
        });
        let deviceName = this.querySelector(".device-name");
        deviceName.style.bottom = (index % 2) ? "-40px" : "-24px";
        deviceName.style.color = "black";
        deviceName.innerText = object[index].name;
        deviceName.style.left = -(deviceName.clientWidth) / 2 + 16 + "px";
        deviceName.style.backgroundColor = "#00000061";
    }
    updateVal(value) {
        let val = value;
        if (this.type == "bool")
            val = (value > 512) ? 1024 : 0;
        this.updateSlider(val);
        //console.log('value: ', val);
        this.bgImage.style.height = Math.round((val / 1024) * RoomDevice.IMG_HEIGHT) + "px";
        this.value = val;
    }
    toggleNameColor() {
        let deviceName = this.querySelector(".device-name");
        if (deviceName.style.color == "rgb(0, 226, 0)")
            deviceName.style.color = "black";
        else
            deviceName.style.color = "rgb(0, 226, 0)";
    }
    updateSlider(value) {
        //this.slider.value=value;
    }
    convertNumToDBVal(val) {
        if (this.type == "bool")
            return (val < 512) ? "off" : "on";
        return val;
    }
    static convertToNumVal(val, type) {
    }
}
RoomDevice.tagName = "room-device";
RoomDevice.IMG_HEIGHT = 32;
