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
    _sliderDbUpdateTimeout: any = undefined; // Timeout of sending values from slider to DB. We don't want to send every single value, but in time intervals (if value changes)...
    _sliderDbUpdateTimeoutTime: number = 1000; // Number of ms between sending values from slider to DB. See _sliderDbUpdateTimeout for more info.
    private _sliderBbUpdateInfo: {path: string, val: string} = undefined; // path to update in database on slider value changed and actual val

    idOfSelectedDevices: string = "";

    constructor(layoutProps?: RoomCardProps) {
        super(layoutProps);

        this.layout = new HorizontalStack({ classList: "card-container" });

        // Everything to Left stack
        this.leftStack = new VerticalStack({ classList: ["left-stack"] });
        let name = new HorizontalStack({ innerText: "Místnost", classList: "room-name" });
        this.leftStack.pushComponents(name);
        this.sensors = new Array();
        this.sensorsStack = new VerticalStack({ classList: "sensors-stack" });
        this.leftStack.pushComponents(this.sensorsStack);

        // Everything to right stack
        this.rightStack = new VerticalStack({
            classList: "right-stack"
        });
        this.slider = new Slider();
        this.slider.initialize(this.sliderChanged);
        this.devices = new Array();
        this.devicesStack = new VerticalStack();
        this.rightStack.appendComponents([this.devicesStack, this.slider]);

        //Append both stacks
        this.layout.appendComponents([this.leftStack, this.rightStack]);
        this.appendComponents(this.layout);


        this.roomName = layoutProps.dbID;
        //Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard)

    }

    getOrderedINOUT(devices, roomName) {
        let orderedIN = new Array();
        let orderedOUT = new Array();

        for (const espName in devices) {
            const devIN = devices[espName].IN;
            for (const pin in devIN) {
                devIN[pin].path = "/rooms/" + roomName + "/devices/" + espName + "/IN/" + pin;
                devIN[pin].id = pin;
                orderedIN.push(devIN[pin]);
            }

            const devOUT = devices[espName].OUT;
            for (const pin in devOUT) {
                devOUT[pin].path = "/rooms/" + roomName + "/devices/" + espName + "/OUT/" + pin;
                devOUT[pin].id = pin;
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

    updateBGImg = (data: any) => {
        //Does img changed?
        let newSrc = (data.img.src.startsWith("https://")) ? `url("${data.img.src}")` : `url(img/"${data.img.src}")`;
        if (newSrc != this.style.backgroundImage) { // Don't reload if it is not needed!
            this.style.backgroundImage = newSrc;
            this.style.backgroundSize = "cover";
        }


        let shiftTimeLimit = setTimeout(() => {  // For case, when imgLoaded of any device dont set to true...
            shiftTimeLimit = undefined;
        }, 10000);
        let shiftBgImg = () => {
            if (!shiftTimeLimit)
                return;
            if (this.devices.every(device => device.imgLoaded)) {
                let newHeight = (this.clientWidth / img.naturalWidth) * img.naturalHeight - this.clientHeight;
                let newPosY = Math.round(-(newHeight * data.img.offset)) + "px";
                if (newPosY != this.style.backgroundPositionY)
                    this.style.backgroundPositionY = newPosY;
                return;
            } else {
                setTimeout(() => {
                    return shiftBgImg();
                }, 20)
            }
        }
        let img = new Image();
        img.addEventListener("load", shiftBgImg);

        img.src = data.img.src;
    }
    updateCard = (data) => {
        (<HTMLElement>this.querySelector(".room-name")).innerText = data.name;

        this.updateBGImg(data);


        let devices = data.devices;
        let ordered = this.getOrderedINOUT(devices, this.roomName);
        let orderedIN = ordered.orderedIN;
        let orderedOUT = ordered.orderedOUT;
        //console.log('orderedIN: ', orderedIN);
        //console.log('orderedOUT: ', orderedOUT);


        let devicesRow = new HorizontalStack({
            classList: "devices-row"
        });

        //Fill sensors and sensorsStack from orderedIN
        this.sensorsStack.innerHTML = "";
        this.sensors = new Array();
        for (const sensor of orderedIN) {
            let s = new RoomSensor();
            s.initialize(sensor);
            this.sensors.push(s);
            this.sensorsStack.pushComponents(s);
        }

        //Fill devices and devicesStack from orderedOUT
        this.devicesStack.innerHTML = "";
        this.devices = new Array();
        if (true/*this.devices.length == 0*/) {
            for (const device of orderedOUT) {
                let lamp = new RoomDevice({});
                this.devices.push(lamp)
                if ((devicesRow.childElementCount * RoomDevice.DEFAULT_DEVICE_WIDTH) > (<number>Utils.getWindowWidth()) * 0.7 - 10) { // -10px left padding
                    this.devicesStack.pushComponents(devicesRow);
                    devicesRow = new HorizontalStack({
                        classList: "devices-row",
                        marginTop: "3.5rem"
                    });
                }
                devicesRow.pushComponents(lamp);
            }
        }
        if (devicesRow.childElementCount) {
            this.devicesStack.pushComponents(devicesRow);
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
            if (device.type == "analog") {// If clicked device is int, show slider
                device.toggleNameColor();
                inputElem.style.visibility = "visible";
                inputElem.value = val;
                this.idOfSelectedDevices = device.dbID;
            } else { // Else is boolean => hide slider if is visible and send new value (opposite that it was) to database
                if (this.idOfSelectedDevices) {
                    inputElem.style.visibility = "hidden";
                    this.idOfSelectedDevices = "";
                }
                let newVal = (device.value < 512) ? 1023 : 0;
                Firebase.updateDBData(device.devicePath, { value: newVal });
            }
        }
    }

    sliderChanged = (value) => {//Called when slider value changed by mouse/touch
        if (this.idOfSelectedDevices) {
            //this.sliderActiveFor.updateVal(value); NOT SET VALUE DIRECTLY, BUT CALL FIREBASE TO UPDATE VALUE, AND FIREBASE (BECAUSE OF VALUE LISTENER) WILL NOTICE DEVICE WHICH CHANGED
            let dev = this.getDeviceByDBID(this.idOfSelectedDevices);
            this._sliderBbUpdateInfo = {path: dev.devicePath, val: value};

            if(!this._sliderDbUpdateTimeout){
                this._sliderDbUpdateTimeout= setTimeout(() => {
                    this._sliderDbUpdateTimeout = undefined;
                    Firebase.updateDBData(this._sliderBbUpdateInfo.path, { value: this._sliderBbUpdateInfo.val });
                }, this._sliderDbUpdateTimeoutTime)
            }
        }
    }

}


export interface RoomCardProps extends IComponentProperties {
    dbID: string
}

export class Slider extends AbstractComponent {
    static tagName = "slider-component";

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
        this.innerHTML = `               
            <input type="range" min="1" max="1023" value="512" class="slider" style="visibility:hidden;">
        `;
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

    initialize(sensor: any) {
        this.layout = new HorizontalStack();
        let icon = this.getIcon(sensor);
        this.layout.pushComponents(icon);
        let name = new BaseComponent({ innerText: sensor.name });

        let valAndUnit = this.getValueAndUnitText(sensor);

        let value = new BaseComponent({ innerText: valAndUnit.valueText });
        value.classList.add("value");

        let unit = new BaseComponent({ innerText: valAndUnit.unitText, marginLeft: "0.5rem" });
        this.layout.pushComponents([name, value, unit]);

        this.appendComponents(this.layout);
    }

    getIcon(sensor) {
        let icon;
        switch (sensor.icon) {
            case "light-intensity":
                icon = new Icon(sensor.icon)
                break;
            case "switch":
                if (sensor.value > 512)
                    icon = new Icon("switch-closed-90")
                else
                    icon = new Icon("switch-opened-90")
                break;
            case "-":
                icon = new Icon("no-icon");
                break;
            default:
                icon = new Icon(sensor.icon)
                break;
        }
        return icon;
    }

    getValueAndUnitText(sensor): { valueText: string, unitText: string } {
        let valueText = "";
        let unitText = "";

        switch (sensor.unit) {
            case "-":
                unitText = "";
        }

        if (sensor.unit.includes("on-off")) {
            let values = ["On", "Off", "Zapnuto", "Vypnuto", "Sepnuto", "Rozepnuto", "Otevřeno", "Zavřeno"];
            let valueIdx = Number.parseInt(sensor.unit.substring("on-off".length));
            valueText = (sensor.value > 512) ? values[valueIdx * 2] : values[valueIdx * 2 + 1];
            unitText = "";
        } else if (sensor.unit == "c") {
            unitText = "°C";
            valueText = (sensor.value) ? sensor.value : "0";
        } else if (sensor.unit == "percentages") {
            unitText = "%";
            valueText = (Math.round((sensor.value  * 100)/ 1023)).toString();
        } else if (sensor.unit == "number") {
            unitText = "";
            valueText = sensor.value;
        }
        return { valueText, unitText };
    }
}

export class RoomDevice extends AbstractComponent {
    static tagName = "room-device";

    slider: any;
    type: any;
    devicePath: string;
    initialized: boolean = false;
    value: number = 0;
    dbID: string;

    static DEFAULT_DEVICE_WIDTH = 150;
    icon: any;
    iconWrapper: any;

    imgLoaded: boolean = false; // We use it when shifting bg img of room card

    constructor(layoutProps?: IComponentProperties) {
        super(layoutProps);
        //this.innerText = initVal.toString();
        this.innerHTML = `
            <div style="position:relative;">    
                <div class="device-name" style="position:absolute;width: max-content;">
                   Nazev
                </div>  
                <div class="device-icon-wrapper">
                </div>
                
            </div>
        `;
        this.iconWrapper = this.querySelector(".device-icon-wrapper");

        this.style.display = "flex";
        this.style.width = "150px";
        this.style.justifyContent = "center";

    }

    initIcon() {

        /*
        
                ["light", "Světlo", "switch", "Spínač", "motor", "Motor"],  // digital
                ["dimmable-light", "Stmívatelné světlo", "servo-motor", "Servo motor"]  //analog
        */
        switch (this.icon) {
            case "light":
                this.iconWrapper.innerHTML = `        
                    <div class="bg-image" style="position:absolute;height: 0px;bottom: 0px;overflow: hidden;">
                        <img src="img/icons/bulb2.png">
                    </div> 
                    <div style="position:relative;display: flex;justify-content: center;">
                        <img src="img/icons/bulb.png">
                    </div>
                `;
                break;
            case "dimmable-light":
                this.iconWrapper.innerHTML = `        
                    <div class="bg-image" style="position:absolute;height: 16px;bottom: 0px;overflow: hidden;">
                        <img src="img/icons/bulb2.png">
                    </div> 
                    <div style="position:relative;display: flex;justify-content: center;">
                        <img src="img/icons/bulb-dimmable2.png">
                    </div>
                `;
                break;
            case "switch":
                this.iconWrapper.innerHTML = `        
                    <div style="position:relative;display: flex;justify-content: center;">
                        <img src="img/icons/switch-closed.png">
                    </div>
                `;
                break;
            default:
                break;
        }
        let img = this.iconWrapper?.querySelector("img");
        if (img) {
            img.addEventListener('load', (event) => {
                this.imgLoaded = true;
            });
        } else {
            this.imgLoaded = true;
        }
    }

    initialize(index, object, onClickCallback) {
        this.type = object[index].type;
        this.icon = object[index].icon;
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
        deviceName.style.left = -(this.calculateStringWidth(object[index].name) / 2) + 16 + "px";
        //deviceName.style.backgroundColor = "#00000061";

        this.initIcon();
    }
    calculateStringWidth(str) {
        let element = document.createElement('canvas');
        let context = element.getContext("2d");
        context.font = "16px Arial";
        return context.measureText(str).width;
    }

    static IMG_HEIGHT = 32;

    updateVal(value) {
        let val = value;
        if (this.type == "digital")
            val = (value > 512) ? 1023 : 0;
        this.updateSlider(val);
        //console.log('value: ', val);

        let bgImage;
        switch (this.icon) {
            case "light":
                bgImage = <HTMLElement>this.querySelector(".bg-image");
                bgImage.style.height = Math.round((val / 1023) * RoomDevice.IMG_HEIGHT) + "px";

                break;

            case "dimmable-light":

                bgImage = <HTMLElement>this.querySelector(".bg-image");
                bgImage.style.height = Math.round((val / 1023) * RoomDevice.IMG_HEIGHT) + "px";
                break;
            case "switch":
                let iconName = (val) ? "switch-closed" : "switch-opened";
                this.iconWrapper.innerHTML = `        
                    <div style="position:relative;display: flex;justify-content: center;">
                        <img src="img/icons/${iconName}.png">
                    </div>
                `;
                break;
            default:


                break;
        }
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
}
