#ifndef HEADER    // Put these two lines at the top of your file.
#define HEADER    // (Use a suitable name, usually based on the file name.)


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
 * Function prototypes
 * */
void checkRPiConn();
void checkMulticast();
void callback_set_io(CoapPacket &packet, IPAddress ip, int port);//??
void callback_get_io(CoapPacket &packet, IPAddress ip, int port);//??
void callback_listen_to(CoapPacket &packet, IPAddress ip, int port);
void callback_set_id(CoapPacket &packet, IPAddress ip, int port);
void callback_reset_module(CoapPacket &packet, IPAddress ip, int port);
void updateEEPROM();
void resetFromEEPROM();

void callback_response(CoapPacket &packet, IPAddress ip, int port);

void checkInValues();

float readSensorVal(char input[]);


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

const byte WATCHED_IN_LIMIT = 20;
typedef enum {
    BMP280_TEMP,
    BMP280_PRESS,
    SHT21_TEMP,
    SHT21_HUM
} I2C_WATCHED_INDEXES;


typedef struct 
{
    char IN[5];
    float val;
} watchedIN;


#endif // Put this line at the end of your file.
