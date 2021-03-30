/*#include "esp.h"

WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 187);
IPAddress RpiIP(192,168,1,4);
String moduleID;
char incomingPacket[255]; // buffer for incoming packets

Coap coap(Udp);
unsigned int CoAPPort = 5683;

String inputPrefix = "input=";
int inputPrefixLen = 6;
int lastConnectedToRPi = 0; // Number of seconds from last connection
bool BMP280Begun = false;
int watchedINIndex = 0;
SensorInfo watched[WATCHED_IN_LIMIT];
Memory mem;
bool IO_Inited = false;

#define BMP280_ADRESS (0x76)
Adafruit_BMP280 bmp;


// Setup module
void setup()
{
    //delay(1000);
    Serial.begin(115200);
    Serial.println();
    randomSeed(micros());
    delay(200); // Sleep little bit after reset to wait for Serial init...

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.printf("\nWiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());

    Serial.println("Setup CoAP callbacks");
    coap.server(callbackSetAllIO, "set-all-IO-state");

    coap.start();
//int msgid = coap.send(RpiIP, CoAPPort, "get-all-IO-state", COAP_CON, COAP_GET, NULL, 0, NULL, 0, COAP_TEXT_PLAIN);
}

// Loop function
void loop()
{
    delay(SENSOR_CHECK_TIME);
    Serial.println("Pre");
    coap.loop();
    Serial.println("POST");
}

// CoAP server endpoint URL
void callbackSetAllIO(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("callbackSetAllIO");
    Serial.println("callbackSetAllIO");
    Serial.println(RpiIP);
    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);

    return;
}

*/

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <coap-simple.h>
const char *password = "netis111";

IPAddress RpiIP(192,168,1,4);

// CoAP server endpoint url callback
void callback_light(CoapPacket &packet, IPAddress ip, int port);

// UDP and CoAP class
WiFiUDP udp;
Coap coap(udp);

// LED STATE  
bool LEDSTATE;

// CoAP server endpoint URL
void callback_light(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Light] ON/OFF");
    coap.sendResponse(ip, port, packet.messageid, "0", 1 ,COAP_CONTENT, COAP_TEXT_PLAIN, packet.token, packet.tokenlen);
    //coap.sendResponse(RpiIP, CoAPPort, "get-all-IO-state", COAP_CON, COAP_GET, NULL, 0, NULL, 0, COAP_TEXT_PLAIN);
  return;
}


void setup() {
  Serial.begin(115200);
    randomSeed(micros());
    delay(200); // Sleep little bit after reset to wait for Serial init...

    Serial.println("ASD");
    Serial.println("ASD");
    Serial.println("ASD");
      delay(500);
      Serial.print(".");
      delay(500);
      Serial.print(".");
  WiFi.begin("sprintel_antlova", "netis111");
  while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
 Serial.println(WiFi.localIP());
  
  coap.server(callback_light, "light");

  // start coap server/client
  coap.start();
}

void loop() {
  delay(1000);
  Serial.println("ddddd");
  coap.loop();
}