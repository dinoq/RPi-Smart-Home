import { AbstractComponent, BaseComponent, IComponentProperties } from "../components/component.js";
import { Config } from "../app/config.js";
import { Firebase } from "../app/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";
import { Icon } from "../components/others/app-icon.js";
import { Utils } from "../app/utils.js";

export class RoomCard extends AbstractComponent {
    static tagName = "room-card";

    layout: HorizontalStack;
    leftStack: VerticalStack;
    roomName: string;
    devices: Array<RoomDevice>;
    devicesStack: HorizontalStack;
    sensors: Array<RoomSensor>;
    sensorsStack: VerticalStack;
    rightStack: VerticalStack;
    slider: Slider;
    idOfSelectedDevices: string = "";

    constructor(layoutProps?: RoomCardProps) {
        super(layoutProps);

        this.layout = new HorizontalStack();

        // Everything to Left stack
        this.leftStack = new VerticalStack();
        this.leftStack.style.width = "30%";
        let name = new HorizontalStack({ innerText: "Místnost" });
        name.classList.add("room-name");
        this.leftStack.pushComponents(name);
        this.sensors = new Array();
        this.sensorsStack = new VerticalStack({ paddingLeft: "15%"/*alignItems: "center"*/ });
        this.leftStack.pushComponents(this.sensorsStack);

        // Everything to right stack
        this.rightStack = new VerticalStack({
            flexDirection: "column-reverse",
            padding: "40px 0"
        });
        this.rightStack.style.width = "70%";
        this.slider = new Slider();
        this.slider.initialize(this.sliderChanged);
        this.devices = new Array();
        this.devicesStack = new VerticalStack();
        this.rightStack.appendComponents([this.devicesStack, this.slider]);

        //Append both stacks
        this.layout.appendComponents([this.leftStack, this.rightStack]);
        this.appendComponents(this.layout);


        this.roomName = layoutProps.roomDBName;
        //Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard)

    }

    static getOrderedINOUT(devices, roomName){
        let orderedIN = new Array();
        let orderedOUT = new Array();

        for (const espName in devices) {
            const devIN = devices[espName].IN;
            for (const pin in devIN) {
                devIN[pin].path = "/rooms/" + roomName + "/devices/" + espName + "/IN/" + pin;
                orderedIN.push(devIN[pin]);
            }

            const devOUT = devices[espName].OUT;
            for (const pin in devOUT) {
                devOUT[pin].path = "/rooms/" + roomName + "/devices/" + espName + "/OUT/" + pin;
                orderedOUT.push(devOUT[pin]);
            }
        }
        orderedIN.sort((a, b) => (a.index > b.index) ? 1 : -1);
        orderedOUT.sort((a, b) => (a.index > b.index) ? 1 : -1);
        return {
            orderedIN: orderedIN,
            orderedOUT: orderedOUT,
        }
    }
    updateCard = (data) => {
        (<HTMLElement>this.querySelector(".room-name")).innerText = data.name;
        this.style.background = (data.img.src.startsWith("https://")) ? "url(" + data.img.src + ")" : "url(img/" + data.img.src + ")";
        this.style.backgroundSize = "cover";
        this.style.backgroundPositionY = data.img.offset + "px";


        let devices = data.devices;
        let ordered = RoomCard.getOrderedINOUT(devices, this.roomName);
        let orderedIN = ordered.orderedIN;
        let orderedOUT = ordered.orderedOUT;
        //console.log('orderedIN: ', orderedIN);
        //console.log('orderedOUT: ', orderedOUT);


        let deviceRow = new HorizontalStack({
            justifyContent: "space-between"
        });

        //Fill sensors and sensorsStack from orderedIN
        this.sensorsStack.innerHTML = "";
        this.sensors = new Array();
        for (const sensor of orderedIN) {
            let s = new RoomSensor({ color: "white" });
            s.initialize(sensor);
            this.sensors.push(s);
            if (!this.sensorsStack.childElementCount)
                s.style.fontSize = "2rem";
            this.sensorsStack.pushComponents(s);
        }

        //Fill devices and devicesStack from orderedOUT
        this.devicesStack.innerHTML = "";
        this.devices = new Array();
        if (true/*this.devices.length == 0*/) {
            for (const device of orderedOUT) {
                let lamp = new RoomDevice({});
                this.devices.push(lamp)
                if ((deviceRow.childElementCount * RoomDevice.DEFAULT_DEVICE_WIDTH) < (<number>Utils.getWindowWidth()) * 0.7) {
                    deviceRow.pushComponents(lamp);
                } else {
                    this.devicesStack.pushComponents(deviceRow);
                    deviceRow = new HorizontalStack({
                        justifyContent: "space-between",
                        marginTop: "3.5rem"
                    });
                }
            }
        }
        if (deviceRow.childElementCount) {
            this.devicesStack.pushComponents(deviceRow);
        }

        // Actualize sensors
        for (let i = 0; i < orderedIN.length; i++) {
            this.sensors[i].updateVal(orderedIN[i].value);
        }

        // Actualize devices
        for (let i = 0; i < orderedOUT.length; i++) {
            let dev = this.devices[i];
            if (!dev.initialized) {
                dev.initialize(i, orderedOUT, this.devicesClicked);
            }
            dev.updateVal(orderedOUT[i].value);
            if (dev.dbID == this.idOfSelectedDevices) {
                dev.toggleNameColor();
            }
        }
    }

    resize = () => {
        //TODO - zatím se nikde "nevolá"
        let deviceRow = new HorizontalStack({
            justifyContent: "space-between"
        });

        let devicesInRow = Math.floor((<number>Utils.getWindowWidth() * 0.7) / RoomDevice.DEFAULT_DEVICE_WIDTH);
        for (let i = 0; i < this.devices.length; i++) {
            if ((i * RoomDevice.DEFAULT_DEVICE_WIDTH) < (<number>Utils.getWindowWidth()) * 0.7) {
                deviceRow.pushComponents(this.devices[i]);
            } else {
                this.devicesStack.pushComponents(deviceRow);
                deviceRow = new HorizontalStack({
                    justifyContent: "space-between",
                    marginTop: "3.5rem"
                });
            }
        }
        if (deviceRow.childElementCount) {
            this.devicesStack.pushComponents(deviceRow);
        }
    }

    getDeviceByDBID(id: string) {
        return this.devices.find((device) => {
            return device.dbID == id;
        })
    }

    devicesClicked = (val, device: RoomDevice) => {//Called when user click on any device (lamp)
        let inputElem = this.slider.querySelector("input");
        if (this.idOfSelectedDevices == device.dbID) { // Clicked on same device (second time)
            inputElem.style.visibility = "hidden";
            this.idOfSelectedDevices = "";
            device.toggleNameColor();
        } else { // Clicked first time on that device
            if (this.idOfSelectedDevices) // If is current selected any device, toggle color of name
                this.getDeviceByDBID(this.idOfSelectedDevices).toggleNameColor();
            if (device.type == "int") {// If clicked device is int, show slider
                device.toggleNameColor();
                inputElem.style.visibility = "visible";
                inputElem.value = val;
                this.idOfSelectedDevices = device.dbID;
            } else { // Else is boolean => hide slider if is visible and send new value (opposite that it was) to database
                if (this.idOfSelectedDevices) {
                    inputElem.style.visibility = "hidden";
                    this.idOfSelectedDevices = "";
                }
                let newVal = (device.value < 512) ? 1024 : 0;
                Firebase.updateDBData(device.devicePath, { value: newVal });
            }
        }
    }

    sliderChanged = (value) => {//Called when slider value changed by mouse/touch
        if (this.idOfSelectedDevices) {
            //this.sliderActiveFor.updateVal(value); NOT SET VALUE DIRECTLY, BUT CALL FIREBASE TO UPDATE VALUE, AND FIREBASE (BECAUSE OF VALUE LISTENER) WILL NOTICE DEVICE WHICH CHANGED
            let dev = this.getDeviceByDBID(this.idOfSelectedDevices);
            Firebase.updateDBData(dev.devicePath, { value: value });
        }
    }

}


export interface RoomCardProps extends IComponentProperties {
    roomDBName: string
}

export class Slider extends AbstractComponent {
    static tagName = "slider-component";

    constructor(layoutProps?: IComponentProperties) {
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
        }
    }
}
export class RoomSensor extends AbstractComponent {
    static tagName = "room-sensor";
    layout: HorizontalStack;

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
    }

    updateVal(value: any) {
        let val = <BaseComponent>this.querySelector(".value");
        val.innerText = value;
    }

    initialize(sensor: any) {
        this.layout = new HorizontalStack();
        let icon = new Icon(sensor.icon);
        this.layout.pushComponents(icon);
        let name = new BaseComponent({ innerText: sensor.name });
        let value = new BaseComponent({ innerText: sensor.value });
        value.classList.add("value");
        let unit = new BaseComponent({ innerText: sensor.unit });
        this.layout.pushComponents([name, value, unit]);

        this.appendComponents(this.layout);
    }
}

export class RoomDevice extends AbstractComponent {
    static tagName = "room-device";

    bgImage: any;
    slider: any;
    type: any;
    devicePath: string;
    initialized: boolean = false;
    value: number = 0;
    dbID: string;

    static DEFAULT_DEVICE_WIDTH = 150;

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
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

    }

    initialize(index, object, onClickCallback) {
        this.type = object[index].type;
        this.devicePath = object[index].path;
        this.dbID = object[index].id;
        this.initialized = true;
        this.addEventListener('click', () => {
            onClickCallback(this.value, this);
        })

        let deviceName = <HTMLElement>this.querySelector(".device-name");
        deviceName.style.bottom = "-1.5rem";
        deviceName.style.color = "white";
        deviceName.innerText = object[index].name;
        deviceName.style.left = -(this.calculateStringWidth(object[index].name)/2) + 16 + "px";
        //deviceName.style.backgroundColor = "#00000061";
    }
    calculateStringWidth(str){
        let element = document.createElement('canvas');
        let context = element.getContext("2d");
        context.font = "16px Arial";
        return context.measureText(str).width;
    }

    static IMG_HEIGHT = 32;

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
        let deviceName = <HTMLElement>this.querySelector(".device-name");
        if (deviceName.style.color == "rgb(102, 255, 102)")
            deviceName.style.color = "white";
        else
            deviceName.style.color = "rgb(102, 255, 102)";
    }

    updateSlider(value) {
        //this.slider.value=value;
    }

    convertNumToDBVal(val: number) {
        if (this.type == "bool")
            return (val < 512) ? "off" : "on";
        return val;
    }

    static convertToNumVal(val: string, type: string) {

    }
}
