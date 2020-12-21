import { AbstractComponent, BaseComponent } from "../components/component.js";
import { Config } from "../utils/config.js";
import { Firebase } from "../utils/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
export class RoomCard extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.sliderActiveFor = null;
        this.updateCard = (data) => {
            this.querySelector(".room-name").innerText = data.name;
            this.style.background = (data.img.src.startsWith("https://")) ? "url(" + data.img.src + ")" : "url(img/" + data.img.src + ")";
            this.style.backgroundSize = "cover";
            this.style.backgroundPositionY = data.img.offset + "px";
            let devices = data.devices;
            let orderedIN = new Array();
            let orderedOUT = new Array();
            for (const espName in devices) {
                const devIN = devices[espName].IN;
                for (const pin in devIN) {
                    devIN[pin].path = "/rooms/" + this.roomName + "/devices/" + espName + "/IN/" + pin;
                    orderedIN.push(devIN[pin]);
                }
                const devOUT = devices[espName].OUT;
                for (const pin in devOUT) {
                    devOUT[pin].path = "/rooms/" + this.roomName + "/devices/" + espName + "/OUT/" + pin;
                    orderedOUT.push(devOUT[pin]);
                }
            }
            orderedIN.sort((a, b) => (a.index > b.index) ? 1 : -1);
            orderedOUT.sort((a, b) => (a.index > b.index) ? 1 : -1);
            //console.log('orderedIN: ', orderedIN);
            //console.log('orderedOUT: ', orderedOUT);
            let deviceRow = new HorizontalStack({
                justifyContent: "space-between"
            });
            this.sensorsStack.innerHTML = "";
            for (const sensor of orderedIN) {
                let s = new RoomSensor({ color: "white" });
                s.initialize(sensor);
                if (!this.sensorsStack.childElementCount)
                    s.style.fontSize = "2rem";
                this.sensorsStack.pushComponent(s);
            }
            this.devicesStack.innerHTML = "";
            this.devices = new Array();
            if (true /*this.devices.length == 0*/) {
                for (const device of orderedOUT) {
                    let lamp = new RoomDevice({});
                    this.devices.push(lamp);
                    if ((deviceRow.childElementCount * RoomDevice.DEFAULT_DEVICE_WIDTH) < Config.getWindowWidth() * 0.7) {
                        deviceRow.pushComponent(lamp);
                    }
                    else {
                        this.devicesStack.pushComponent(deviceRow);
                        deviceRow = new HorizontalStack({
                            justifyContent: "space-between",
                            marginTop: "3.5rem"
                        });
                    }
                }
            }
            if (deviceRow.childElementCount) {
                this.devicesStack.pushComponent(deviceRow);
            }
            for (let i = 0; i < this.devices.length; i++) {
                if (!this.devices[i].initialized) {
                    this.devices[i].initialize(i, orderedOUT, this.changeSliderVisibility);
                }
                this.devices[i].updateVal(orderedOUT[i].value);
                if (this.devices[i] == this.sliderActiveFor) {
                    let val = orderedOUT[i].value;
                    if (orderedOUT[i].type == "bool") {
                        val = (orderedOUT[i].value == "on") ? 1024 : 0;
                    }
                    this.slider.querySelector("input").value = val;
                }
            }
        };
        this.resize = () => {
            let deviceRow = new HorizontalStack({
                justifyContent: "space-between"
            });
            let devicesInRow = Math.floor((Config.getWindowWidth() * 0.7) / RoomDevice.DEFAULT_DEVICE_WIDTH);
            for (let i = 0; i < this.devices.length; i++) {
                if ((i * RoomDevice.DEFAULT_DEVICE_WIDTH) < Config.getWindowWidth() * 0.7) {
                    deviceRow.pushComponent(this.devices[i]);
                }
                else {
                    this.devicesStack.pushComponent(deviceRow);
                    deviceRow = new HorizontalStack({
                        justifyContent: "space-between",
                        marginTop: "3.5rem"
                    });
                }
            }
            if (deviceRow.childElementCount) {
                this.devicesStack.pushComponent(deviceRow);
            }
        };
        this.changeSliderVisibility = (val, caller) => {
            let inputElem = this.slider.querySelector("input");
            if (this.sliderActiveFor == caller) {
                inputElem.style.visibility = "hidden";
                this.sliderActiveFor = null;
                caller.toggleNameColor();
            }
            else {
                if (this.sliderActiveFor)
                    this.sliderActiveFor.toggleNameColor();
                caller.toggleNameColor();
                inputElem.style.visibility = "visible";
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
        this.layout = new HorizontalStack();
        // Everything to Left stack
        this.leftStack = new VerticalStack();
        this.leftStack.style.width = "30%";
        let name = new HorizontalStack({ innerText: "Místnost" });
        name.classList.add("room-name");
        this.leftStack.pushComponent(name);
        this.sensorsStack = new VerticalStack({ paddingLeft: "15%" /*alignItems: "center"*/ });
        this.leftStack.pushComponent(this.sensorsStack);
        // Everything to right stack
        this.rightStack = new VerticalStack({
            flexDirection: "column-reverse",
            padding: "40px 0"
        });
        this.rightStack.style.width = "70%";
        this.slider = new Slider();
        this.slider.initialize(this.sliderChanged);
        this.devicesStack = new VerticalStack();
        this.devices = new Array();
        this.rightStack.appendComponents([this.devicesStack, this.slider]);
        //Append both stacks
        this.layout.appendComponents([this.leftStack, this.rightStack]);
        this.appendComponents(this.layout);
        this.roomName = layoutProps.roomDBName;
        Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard);
    }
}
RoomCard.tagName = "room-card";
export class Slider extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
        this.innerHTML = `               
            <input type="range" min="1" max="1024" value="512" class="slider" style="width: 100%; visibility:hidden;margin-bottom: 2rem;">
        `;
        this.style.marginRight = "5px";
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
export class RoomSensor extends AbstractComponent {
    constructor(layoutProps) {
        super(layoutProps);
    }
    initialize(sensor) {
        this.layout = new HorizontalStack();
        let icon = new Icon(sensor.icon);
        this.layout.pushComponent(icon);
        this.layout.pushComponent(new BaseComponent({ innerText: sensor.value + " " + sensor.unit }));
        this.appendComponents(this.layout);
    }
}
RoomSensor.tagName = "room-sensor";
export class Icon extends AbstractComponent {
    constructor(icon, layoutProps) {
        super(layoutProps);
        this.innerHTML = "<img>";
        this.img = this.querySelector("img");
        this.img.src = Icon.srcFromName(icon);
    }
    static srcFromName(name) {
        switch (name) {
            case "temp": return "img/icons/temp.png";
            case "humidity": return "img/icons/humidity.png";
            case "switch": return "img/icons/temp.png";
            default: return "img/icons/temp.png";
        }
    }
}
Icon.tagName = "app-icon";
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
        //deviceName.style.bottom = (index % 2) ? "-3rem" : "-1.5rem";
        deviceName.style.bottom = "-1.5rem";
        deviceName.style.color = "white";
        deviceName.innerText = object[index].name;
        deviceName.style.left = -(deviceName.clientWidth) / 2 + 16 + "px";
        //deviceName.style.backgroundColor = "#00000061";
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
        if (deviceName.style.color == "rgb(102, 255, 102)")
            deviceName.style.color = "white";
        else
            deviceName.style.color = "rgb(102, 255, 102)";
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
RoomDevice.DEFAULT_DEVICE_WIDTH = 150;
RoomDevice.IMG_HEIGHT = 32;
