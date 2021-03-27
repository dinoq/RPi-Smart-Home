export class BoardsManager {

    static getAnalogPins(boardType: string): Array<string> {
        return (Board[boardType]) ? Board[boardType].analogPins : [];
    }
    static getDigitalPins(boardType: string): Array<string> {
        return (Board[boardType]) ? Board[boardType].digitalPins : [];
    }

    static mapToArrayForSelect(type: string, boardType: string): Array<string> {
        let optionArr = new Array();

        if (!Board[boardType])
            return optionArr;

        if (type == "digital" || type == "analog") {
            let pins: object;
            let typeAbbr;

            if (type == "digital") {
                pins = Board[boardType].digitalPins;
                typeAbbr = "D";
            } else {
                pins = Board[boardType].analogPins;
                typeAbbr = "A";
            }
            for (const pin in pins) {
                optionArr.push(typeAbbr + pins[pin]);
                optionArr.push(`${pin} (pin ${pins[pin]})`);
            }
        } else if (type == "bus") {
            let buses: Array<string> = Board[boardType].bus;

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
        return optionArr;
    }
}

export class Board {
    static wemosD1R1 = {
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
            //D11: 13, // Connected to D7
            //D12: 12, // Connected to D6
            //D13: 14, // Connected to D5, Board LED
            //D14: 4, // Connected to D4
            //D15: 5, // Connected to D3
        },

        bus: ["SPI", "I2C"]
    };
    
    static NodeMCU = {
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
            //RX: 3,
            //TX: 1,
            //SD2: 9,
            //SD3: 10
        },

        bus: ["SPI", "I2C"]
    };
}

class BusDevices {
    static I2C = ["BMP280 (teplota)", "BMP280 (tlak)","SHT21 (teplota)", "SHT21 (vlhkost)"]

    static SPI = []
}