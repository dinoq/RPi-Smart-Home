export class BoardsManager {
    static getAnalogPins(boardType) {
        return (Board[boardType]) ? Board[boardType].analogPins : [];
    }
    static getDigitalPins(boardType) {
        return (Board[boardType]) ? Board[boardType].digitalPins : [];
    }
    /**
     *
     * @param typeOfIO
     * @param boardType
     * @param type Rozhoduje, co chceme funkcí získat, zda to, co má být v selectu jako value ("value"), nebo innerText ("text")
     * @returns
     */
    static mapToArrayForSelect(typeOfIO, boardType, type) {
        let optionArr = new Array();
        type = (type == "value" || type == "text") ? type : "text";
        if (!Board[boardType])
            return optionArr;
        if (typeOfIO == "digital" || typeOfIO == "analog") {
            let pins;
            let typeAbbr;
            if (typeOfIO == "digital") {
                pins = Board[boardType].digitalPins;
                typeAbbr = "D";
            }
            else {
                pins = Board[boardType].analogPins;
                typeAbbr = "A";
            }
            for (const pin in pins) {
                if (type == "value")
                    optionArr.push(typeAbbr + pins[pin]);
                else
                    optionArr.push(`${pin} (pin ${pins[pin]})`);
            }
        }
        else if (typeOfIO == "bus") {
            let buses = Board[boardType].bus;
            if (buses) {
                for (const bus of buses) {
                    for (const busDevice of BusDevices[bus]) {
                        //let sensorName = busDevice.substring(0, busDevice.indexOf(""))
                        let sensorName = busDevice.replaceAll(" ", "-");
                        sensorName = sensorName.replace("(", "");
                        sensorName = sensorName.replace(")", "");
                        sensorName = sensorName.replaceAll("ě", "e");
                        sensorName = sensorName.replaceAll("š", "s");
                        sensorName = sensorName.replaceAll("č", "c");
                        sensorName = sensorName.replaceAll("ř", "r");
                        sensorName = sensorName.replaceAll("ž", "z");
                        sensorName = sensorName.replaceAll("ý", "y");
                        sensorName = sensorName.replaceAll("á", "a");
                        sensorName = sensorName.replaceAll("í", "i");
                        sensorName = sensorName.replaceAll("é", "e");
                        if (type == "value")
                            optionArr.push(`${bus}-${sensorName}`);
                        else
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
        //D3: 5, // SCL
        //D4: 4, // SDA
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
    bus: ["I2C"]
};
Board.NodeMCU = {
    analogPins: {
        A0: 17
    },
    digitalPins: {
        //D0: 16, // Board LED
        //D1: 5, // SCL
        //D2: 4, // SDA
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
    bus: ["I2C"]
};
Board.esp01 = {
    analogPins: {},
    digitalPins: {
        D0: 0,
        //D1: 1, // ESP8266 LED
        D2: 2,
        D3: 3,
    },
    builtInLedPin: 1,
};
class BusDevices {
}
BusDevices.I2C = ["BMP280 (teplota)", "BMP280 (tlak)", "SHT21 (teplota)", "SHT21 (vlhkost)", "BH1750 (intenzita světla)"];
