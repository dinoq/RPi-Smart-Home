import { AbstractComponent, componentProperties } from "../components/component.js";
import { Firebase } from "../utils/firebase.js";
import { HorizontalStack } from "./horizontal-stack.js";
import { VerticalStack } from "./vertical-stack.js";

export class RoomCard extends AbstractComponent {
    static tagName = "room-card";

    mainHStack: HorizontalStack;
    sensorStack: VerticalStack;
    devicesStack: HorizontalStack;
    roomName: string;
    devices: Array<RoomDevice>;

    constructor(layoutProps?: RoomCardProps) {
        super(layoutProps);

        this.mainHStack = new HorizontalStack();
        this.sensorStack = new VerticalStack();
        this.devicesStack = new HorizontalStack();

        this.devices = new Array();
        
        this.roomName = layoutProps.roomName;
        Firebase.addDBListener("/rooms/" + this.roomName, this.updateCard)

        this.mainHStack.appendComponents([this.sensorStack, this.devicesStack]);
        this.appendComponents(this.mainHStack);

    }

    updateCard = (data) => {
        console.log(this.roomName + ":");
        let outputs = this.getDevices(data.devices);
    }

    getDevices(devices: any) {
        let ordered = new Array();
        for (const espName in devices) {
            const out = devices[espName].OUT;
            for(const pin in out){
                ordered.push(out[pin]);
            }

        }
        ordered.sort((a, b) => (a.index > b.index) ? 1 : -1)

        
        if(this.devices.length == 0){
            for(const device of ordered){
                let lamp = new RoomDevice(device.value, {});
                this.devices.push(lamp)
                this.devicesStack.pushComponent(lamp);
            }
        }else{
            for(let i = 0; i < this.devices.length; i++){
                this.devices[i].updateVal(ordered[i].value);
            }
        }
        console.log('ordered: ', ordered);
    }
}


export interface RoomCardProps extends componentProperties {
    roomName: string
}

export class RoomDevice extends AbstractComponent{
    static tagName = "room-device";

    constructor(initVal: string | number, layoutProps?: componentProperties) {
        super(layoutProps);
        this.innerText = initVal.toString();
    }

    updateVal(value){
        console.log('value: ', value);
        this.innerText = value;
    }
}