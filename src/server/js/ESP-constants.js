// From esp.h:
var VALUE_TYPE;
(function (VALUE_TYPE) {
    VALUE_TYPE[VALUE_TYPE["ANALOG"] = 1] = "ANALOG";
    VALUE_TYPE[VALUE_TYPE["DIGITAL"] = 2] = "DIGITAL";
    VALUE_TYPE[VALUE_TYPE["I2C"] = 3] = "I2C";
})(VALUE_TYPE || (VALUE_TYPE = {}));
;
var IN_TYPE;
(function (IN_TYPE) {
    //I2C
    IN_TYPE[IN_TYPE["BMP280_TEMP"] = 20] = "BMP280_TEMP";
    IN_TYPE[IN_TYPE["BMP280_PRESS"] = 21] = "BMP280_PRESS";
    IN_TYPE[IN_TYPE["SHT21_TEMP"] = 22] = "SHT21_TEMP";
    IN_TYPE[IN_TYPE["SHT21_HUM"] = 23] = "SHT21_HUM";
})(IN_TYPE || (IN_TYPE = {}));
;
class SensorInfo {
    SensorInfo(IN, val_type, val) {
        this.IN = IN;
        this.val_type = val_type;
        this.val = val;
    }
    //returns input in database format
    getInput() {
        let analog = this.val_type == VALUE_TYPE.ANALOG;
        let digital = this.val_type == VALUE_TYPE.DIGITAL;
        let i2c = this.val_type == VALUE_TYPE.I2C;
        let str = "";
        if (analog || digital) {
            str = (analog) ? "A" : "D";
            str += this.IN;
        }
        else if (i2c) {
            if (this.IN < IN_TYPE.BMP280_TEMP) {
            }
            else { // I2C
                let type = SensorInfo.IN_TYPE_TO_STR[this.IN];
                if (type != undefined)
                    str = "I2C-" + type;
            }
        }
        return str;
    }
}
SensorInfo.IN_TYPE_TO_STR = {}; // definition at end of page
;
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.BMP280_TEMP] = "BMP280-teplota";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.BMP280_PRESS] = "BMP280-tlak";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.SHT21_TEMP] = "BMP280-teplota";
SensorInfo.IN_TYPE_TO_STR[IN_TYPE.SHT21_HUM] = "BMP280-vlhkost";
module.exports = {
    VALUE_TYPE: VALUE_TYPE,
    IN_TYPE: IN_TYPE,
    SensorInfo: SensorInfo
};
