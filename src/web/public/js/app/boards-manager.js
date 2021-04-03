export class BoardsManager {
    static getAnalogPins(boardType) {
        return (Board[boardType]) ? Board[boardType].analogPins : [];
    }
    static getDigitalPins(boardType) {
        return (Board[boardType]) ? Board[boardType].digitalPins : [];
    }
    static mapToArrayForSelect(type, boardType) {
        let optionArr = new Array();
        if (!Board[boardType])
            return optionArr;
        if (type == "digital" || type == "analog") {
            let pins;
            let typeAbbr;
            if (type == "digital") {
                pins = Board[boardType].digitalPins;
                typeAbbr = "D";
            }
            else {
                pins = Board[boardType].analogPins;
                typeAbbr = "A";
            }
            for (const pin in pins) {
                optionArr.push(typeAbbr + pins[pin]);
                optionArr.push(`${pin} (pin ${pins[pin]})`);
            }
        }
        else if (type == "bus") {
            let buses = Board[boardType].bus;
            if (buses) {
                for (const bus of buses) {
                    for (const busDevice of BusDevices[bus]) {
                        //let sensorName = busDevice.substring(0, busDevice.indexOf(""))
                        let sensorName = busDevice.replace(" ", "-");
                        sensorName = sensorName.replace("(", "");
                        sensorName = sensorName.replace(")", "");
                        optionArr.push(`${bus}-${sensorName}`);
                        optionArr.push(`${busDevice}`);
                    }
                }
            }
        }
        return optionArr;
    }
}
export class Board {
}
Board.wemosD1R1 = {
    analogPins: {
        A0: 17
    },
    digitalPins: {
        D0: 3,
        D1: 1,
        D2: 16,
        D3: 5,
        D4: 4,
        //D5: 14,// Board LED
        D6: 12,
        D7: 13,
        D8: 0,
        //D9: 2, // ESP8266 LED
        D10: 15,
    },
    builtInLedPin: 2,
    i2cPins: {
        SCL: "D3",
        SDA: "D4"
    },
    bus: ["SPI", "I2C"]
};
Board.NodeMCU = {
    analogPins: {
        A0: 17
    },
    digitalPins: {
        //D0: 16, // Board LED
        D1: 5,
        D2: 4,
        D3: 0,
        //D4: 2, // ESP8266 LED
        D5: 14,
        D6: 12,
        D7: 13,
        D8: 15,
    },
    builtInLedPin: 2,
    i2cPins: {
        SCL: "D1",
        SDA: "D2"
    },
    bus: ["SPI", "I2C"]
};
Board.esp01 = {
    analogPins: {},
    digitalPins: {
        D0: 0,
        D1: 1,
        D2: 2,
        D3: 3,
    },
    builtInLedPin: 1,
};
class BusDevices {
}
BusDevices.I2C = ["BMP280 (teplota)", "BMP280 (tlak)", "SHT21 (teplota)", "SHT21 (vlhkost)"];
BusDevices.SPI = [];
