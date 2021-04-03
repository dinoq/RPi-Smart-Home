
// From esp.h:
enum VALUE_TYPE {
    ANALOG = 1, // Start from 1, because we add it to string and we don't want to consider it as null terminator
    DIGITAL,
    I2C
};

enum IN_TYPE {

    //I2C
    BMP280_TEMP = 20, //from 0 are pin numbers...
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM,

};


class SensorInfo {
    IN; //Pin number or I2C_IN_TYPE
    val_type; // ANALOG/DIGITAL/I2C
    val: number | string; // number value or string "??"

    constructor(IN: IN_TYPE, val_type: VALUE_TYPE, val: number | string) {
        this.IN = IN;
        this.val_type = val_type;
        this.val = val;
    }

    //returns input in database format
    public getInput() {
        let analog = this.val_type == VALUE_TYPE.ANALOG;
        let digital = this.val_type == VALUE_TYPE.DIGITAL;
        let i2c = this.val_type == VALUE_TYPE.I2C;

        let str = "";
        if (analog || digital) {
            str = (analog) ? "A" : "D";
            str += this.IN;
        } else if (i2c) {
            if (this.IN < IN_TYPE.BMP280_TEMP) {

            } else { // I2C
                let type = SensorInfo.IN_TYPE_TO_STR[this.IN];
                if (type != undefined)
                    str = "I2C-" + type;
            }

        }
        return str;
    }

    static IN_TYPE_TO_STR = {}; // definition at end of page

};

SensorInfo.IN_TYPE_TO_STR[IN_TYPE.BMP280_TEMP] = "BMP280-teplota";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.BMP280_PRESS] = "BMP280-tlak";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.SHT21_TEMP] = "SHT21-teplota";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.SHT21_HUM] = "SHT21-vlhkost";


module.exports = {
    VALUE_TYPE: VALUE_TYPE,
    IN_TYPE: IN_TYPE,
    SInfo: SensorInfo
}
