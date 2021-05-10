#ifndef HLAVICKA 
#define HLAVICKA 

#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <BH1750.h> // BH1750 sensor library
#include <Adafruit_BMP280.h> // BMP280 sensor library
#include <Sodaq_SHT2x.h> // SHT21 sensor library

#include "memory.h"


/**
 * ZAČÁTEK KONFIGURAČNÍ ČÁSTI (doporučeno změnit)
 */

String boardType = "NodeMCU"; // Cokoli z [wemosD1R1, NodeMCU, esp01]
const char *ssid = "DOPLNIT";
const char *password = "DOPLNIT";
IPAddress moduleStaticIP(192, 168, 1, 103); // statická IP modulu, pokud ji uživatel chce používat
// Pokud uživatel nechce používat statickou IP, odkomentovat řádek níže a zakomentovat ten výše...
//IPAddress moduleStaticIP; 
IPAddress gateway(192, 168, 1, 1);   //IP adresa výchozí brány (pro použití statické IP)
IPAddress subnet(255, 255, 255, 0); // Maska podsítě (pro použití statické IP)
/**
 * KONEC KONFIGURAČNÍ ČÁSTI 
 */


/**
 * TYPEDEF
 */
typedef struct SInfo SensorInfo;

/**
 * TYPEDEF
 */

/**
 * ZAČÁTEK PROTOTYPŮ FUNKCÍ
 * */

void setup();

void loop();

void checkMulticast();
void checkInValues();
float getSensorVal(SensorInfo sInfo);
float getSensorVal(byte val_type, byte IN);
float getI2CVal(byte IN);
bool isDifferentEnough(float oldVal, float newVal, byte IN);
bool valueIsIn(byte val, byte arr[]);

void callbackResponse(CoapPacket &packet, IPAddress ip, int port);

void callbackSetID(CoapPacket &packet, IPAddress ip, int port);
void setRPiIP(IPAddress ip);
void callbackHelloClient(CoapPacket &packet, IPAddress ip, int port);
void setModuleID(char ID[], byte idLen);
void resetSensorInfos();
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

bool checkIO_Inited();

void blinkIfNotConnectedAndDelay();

void beginWireIfNotBegun(boolean forceBegin);
void beginWireIfNotBegun();
boolean beginBMP(boolean forceBegin);
boolean beginBMP();

void beginBH1750(boolean forceBegin);
void beginBH1750();

void sendErrorReportToServer(char errorMsg[], const char funcName[]);

void pinWrite(byte pinNumber, int value, String pinType);

/**
 * KONEC PROTOTYPŮ FUNKCÍ
 * */

const byte WATCHED_IN_LIMIT = 20;

const float INVALID_SENSOR_VALUE = -2000000000.0;       // hodnota, kterou žádný snímač nebu"Random" value, which will probably not be used in any sensor as valid value
const float UNITIALIZED_SENSOR_VALUE = -1000000000.0; // "Random" value, which will probably not be used in any sensor as valid value
const int SENSOR_CHECK_TIME = 2000;                     // How often check for sensors values (in ms). Must be > 180 if sensor BH1750 is used.

const byte ID_MEM_ADDR = 7;       // Address of beginning of SensorInfos in flash memory. It is saved after string "IP:????" => 7
const byte ID_MEM_DATA_ADDR = 10;          // "IP:????ID:" => 7+3
const byte USED_MEM_END = 31;              // Address of end of used flash memory. "IP:????ID:(byte)*21 [ID is 20 chars in firebase + null terminator] => 10+21 => 31

const byte UNSET = 254;
const byte UNKNOWN = 255;

const byte L = LOW;
const byte H = HIGH;

const byte LED_BUILTIN_HIGH = LOW; // Built in LED has "inverted" logic
const byte LED_BUILTIN_LOW = HIGH;

typedef enum
{

    //I2C
    BMP280_TEMP = 20, //from 0 are pin numbers...
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM,
    BH1750_LUX,

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

#endif
