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
            for (const bus of buses) {
                for (const busDevice of BusDevices[bus]) {
                    optionArr.push(`${bus}-${busDevice}`);
                    optionArr.push(`${busDevice} (${bus})`);
                }
            }
        }
        return optionArr;
    }
}
class Board {
}
Board.wemosD1 = {
    analogPins: {
        A0: 17
    },
    digitalPins: {
        D0: 3,
        D1: 1,
        D2: 16,
        D3: 5,
        D4: 4,
        D5: 14,
        D6: 12,
        D7: 13,
        D8: 0,
        D9: 2,
        D10: 15,
        D11: 13,
        D12: 12,
        D13: 14,
        D14: 4,
        D15: 5,
    },
    bus: ["SPI", "I2C"]
};
class BusDevices {
}
BusDevices.I2C = ["BME280"];
BusDevices.SPI = [];
