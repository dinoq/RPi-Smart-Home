#ifndef HEADER // Put these two lines at the top of your file.
#define HEADER // (Use a suitable name, usually based on the file name.)

#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
//#include "user_interface.h"
#include <Wire.h>
//#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <Sodaq_SHT2x.h>

#include "memory.h"

/**
 * Function prototypes PART END
 * */

/**
 * CONFIG PART BEGIN (recommended to change)
 */

String boardType = "NodeMCU"; // Any from [wemosD1, NodeMCU]
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

void setup();

void loop();

void checkRPiConn();
void checkMulticast();
void checkInValues();
void initIfBMP280AndNotInited(byte IN);
float getSensorVal(SensorInfo sInfo);
float getSensorVal(byte val_type, byte IN);
float getI2CVal(byte IN);
bool isDifferentEnough(float oldVal, float newVal, byte IN);
bool valueIsIn(byte val, byte arr[]);

void callbackResponse(CoapPacket &packet, IPAddress ip, int port);

void callbackSetId(CoapPacket &packet, IPAddress ip, int port);
void setRPiIP(IPAddress ip);
void callbackHelloClient(CoapPacket &packet, IPAddress ip, int port);
void setModuleID(char ID[], byte idLen);
void callbackResetModule(CoapPacket &packet, IPAddress ip, int port);
void resetModule();
void callbackSetAllIO(CoapPacket &packet, IPAddress ip, int port);
void callbackSetOutput(CoapPacket &packet, IPAddress ip, int port);
void callbackObserveInput(CoapPacket &packet, IPAddress ip, int port);
void callbackStopInputObservation(CoapPacket &packet, IPAddress ip, int port);
SensorInfo getSensorInfo(char input[]);
bool alreadyWatched(SensorInfo sInfo);
void callbackChangeObservedInput(CoapPacket &packet, IPAddress ip, int port);

void resetFromMemory();
void printMemory(String msg);




/**
 * Function prototypes PART BEGIN
 * */

const byte WATCHED_IN_LIMIT = 20;

const float INVALID_SENSOR_VALUE = -1000000000.0;       // "Random" value, which will probably not be used in any sensor as valid value
const float UNINITIALIZED_SENSOR_VALUE = -1000000000.0; // "Random" value, which will probably not be used in any sensor as valid value
const int SENSOR_CHECK_TIME = 500;                     // How often check for sensors values (in ms)

const byte ID_MEM_ADDR = 7;       // Address of beginning of SensorInfos in flash memory. It is saved after string "IP:????" => 7
const byte ID_MEM_DATA_ADDR = 10;          // "IP:????ID:" => 7+3
const byte USED_MEM_END = 31;              // Address of end of used flash memory. "IP:????ID:(byte)*21 [ID is 20 chars in firebase + null terminator] => 10+21 => 31

const byte UNSET = 254;
const byte UNKNOWN = 255;

const byte L = LOW;
const byte H = HIGH;

typedef enum
{

    //I2C
    BMP280_TEMP = 20, //from 0 are pin numbers...
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM,

} IN_TYPE;

typedef enum
{
    ANALOG = 1, // Start from 1, because we add it to string and we don't want to consider it as null terminator
    DIGITAL,
    I2C
} VALUE_TYPE;

struct SInfo
{
    byte IN;       //Pin number or I2C_IN_TYPE
    byte val_type; // ANALOG/DIGITAL/I2C
    float val;
};

#endif // Put this line at the end of your file.
