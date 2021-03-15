#ifndef HEADER // Put these two lines at the top of your file.
#define HEADER // (Use a suitable name, usually based on the file name.)

#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include <EEPROM.h>
//#include "user_interface.h"
#include <Wire.h>
//#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <Sodaq_SHT2x.h>

/**
 * Function prototypes PART END
 * */

/**
 * CONFIG PART BEGIN (recommended to change)
 */

String boardType = "wemosD1"; // Any from [wemosD1, NodeMCU]
const char *ssid = "sprintel_antlova";
const char *password = "netis111";
/**
 * CONFIG PART END
 */

/**
 * OPTIONAL CONFIG PART BEGIN
 */

int withoutConnTimeLimit = 180; // Max number of seconds without connection to Raspberry Pi. After this time will module try to listen on "all CoAP nodes" multicast group.

/**
 * OPTIONAL CONFIG PART END
 */

/**
 * TYPEDEF PART BEGIN
 */
typedef struct SInfo SensorInfo;

/**
 * TYPEDEF PART END
 */

/**
 * Function prototypes PART BEGIN
 * */
void checkRPiConn();
void checkMulticast();
void callback_set_io(CoapPacket &packet, IPAddress ip, int port); //??
void callback_get_io(CoapPacket &packet, IPAddress ip, int port); //??
void callback_listen_to(CoapPacket &packet, IPAddress ip, int port);
void callback_set_id(CoapPacket &packet, IPAddress ip, int port);
void callback_reset_module(CoapPacket &packet, IPAddress ip, int port);
void reset_module();
void updateEEPROM();
void resetFromEEPROM();

void callback_response(CoapPacket &packet, IPAddress ip, int port);

void checkInValues();

//float readSensorVal(char input[]);

SensorInfo getSensorInfo(char input[]);

const byte WATCHED_IN_LIMIT = 20;
const float INVALID_SENSOR_VALUE = -1000000000.0; // "Random" value, which will probably not be used in any sensor as valid value
const byte SENSOR_INFO_MEM_ADDR = 13; // Address of beginning of SensorInfos in flash memory. It is saved after string "IP:????SInfo:" => 13
const byte ID_MEM_ADDR = 133; // Address of beginning of SensorInfos in flash memory. It is saved after string "IP:????SInfo:(byte+byte+float)*20" => 13+(1+1+4)*20 => 133
const byte USED_MEM_END = 156; // Address of beginning of SensorInfos in flash memory. It is saved after string "IP:????SInfo:(byte+byte+float)*20ID:(byte)*21 [ID is 20 chars in firebase + null terminator] => 13+(1+1+4)*20+2+20 => 156

const byte UNSET = 254;
const byte UNKNOWN = 255;

typedef enum
{

    //I2C
    BMP280_TEMP = 20, //from 0 are pin numbers...
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM,

} I2C_IN_TYPE;

typedef enum
{
    ANALOG,
    DIGITAL,
    I2C
} VALUE_TYPE;

struct SInfo
{
    byte IN; //Pin number or I2C_IN_TYPE
    byte val_type;
    float val;
};

#endif // Put this line at the end of your file.
