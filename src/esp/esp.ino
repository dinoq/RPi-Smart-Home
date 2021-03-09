#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include "user_interface.h"


#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>


#ifndef APSSID
#define APSSID "sprintel_antlova"
#define APPSK "netis111"
#endif

/**
 * Function prototypes
 * */
void checkMulticast();
void callback_light(CoapPacket &packet, IPAddress ip, int port);

const char *ssid = APSSID;
const char *password = APPSK;

WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 187);
char incomingPacket[255];                             // buffer for incoming packets
char replyPacket[] = "Hi there! Got the message :-)"; // a reply string to send back

Coap coap(Udp);
unsigned int CoAPPort = 5683;

/**
 * Others variables
 * */
bool connectedToRPi = false;
String multicastMsgPrefix = "RPi-server-IP:";
int multicastMsgPrefixLen = 14; // Length of string "RPi-server-IP:", which is send via multicast to newly added modules
String pinPrefix = "pin=";
int pinPrefixLen = 4;

/**
 * BMP280
 */
#define BMP280_ADRESS (0x76)
Adafruit_BMP280 bmp;

/**
 * 
 * Functions implementations
 * */

// Setup module
void setup()
{
    //delay(1000);
    Serial.begin(115200);
    randomSeed(micros());

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    Serial.println("Setup Callback Light ver 4");
    coap.server(callback_set_io, "set-io");
    coap.server(callback_get_io, "get-io");
    
    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort);
    Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), CoAPPort);

    coap.start();
    
    if (!bmp.begin(BMP280_ADRESS)) {
      Serial.println("BMP280 senzor nenalezen");
    }
}

// Loop function
void loop()
{
    delay(1000);
    checkMulticast();
    coap.loop();
    
}

void checkMulticast()
{
    //if (connectedToRPi) // If module is already connected to RPi then skip check of multicast...
        //return;
    int packetSize = Udp.parsePacket();
    if (packetSize)
    {
        if(!Udp.destinationIP().toString().equals(multicastIP.toString())){
            Serial.println("Received via multicast");
        }else{            
            return;
            Serial.println("NOT!! via multicast");
        }
        // receive incoming UDP packets
        Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
        int len = Udp.read(incomingPacket, 255);
        if (len > 0)
        {
            incomingPacket[len] = 0;
            Serial.printf("UDP packet contents: %s\n", incomingPacket);
            if (len > multicastMsgPrefixLen){
                String prefix = String(incomingPacket).substring(0, multicastMsgPrefixLen);
                if(prefix.equals(multicastMsgPrefix))
                {
                    Serial.println("Zbytek:" + String(incomingPacket).substring(multicastMsgPrefixLen));
                    connectedToRPi = true;
                }
            }
        }
        // send back a reply, to the IP address and port we got the packet from
        Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
        Udp.write(replyPacket);
        Udp.endPacket();
    }
}

// CoAP server endpoint URL 
void callback_set_io(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("Set IO");

    // send response
    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    CoapOption option;   
    for(int i = 0; i<COAP_MAX_OPTION_NUM; i++){
        option = packet.options[i];
        if(!option.length)
            continue;
        if(option.number == COAP_URI_QUERY){
            Serial.print("query at i:");
            Serial.println(i);
            break;
        }

    }
    if(option.number != COAP_URI_QUERY && !option.length){
        return;
        //TODO :coap.sendResponse ??
    }
    char queryOpt[option.length];
    memcpy(queryOpt, option.buffer, option.length);
    queryOpt[option.length] = NULL;
    
    String pin = String(queryOpt).substring(pinPrefixLen);
    bool digital = pin.substring(0,1).equals("D"); // If first char is D => digital pin. Analog otherwise.
    int pinNumber = pin.substring(1).toInt(); //Here we use pin number directly (without constants like A0, D5 etc...)

    String payload(p);
    
    int valueToSet = payload.toInt();
    pinMode(pinNumber, OUTPUT);
    if(digital){ // Digital pin
        Serial.println(valueToSet);
        if(valueToSet > 512){
            digitalWrite(pinNumber, LOW);
            Serial.println("LOW"+ String(pinNumber));
        }
        else{            
            digitalWrite(pinNumber, HIGH);
            Serial.println("HEIGHT"+ String(pinNumber));
        }
    }else{ // Analog pin
        analogWrite(pinNumber,valueToSet);
            Serial.println("ANALOG:" + String(valueToSet));
    }

    String responseStr = "set A/D: " + pin.substring(0,1) + ", val: " + valueToSet + ", pin: " + pinNumber;
    char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), responseStr.length());
    response[sizeof(response) - 1] = 0;
    
    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}


// CoAP server endpoint URL 
void callback_get_io(CoapPacket &packet, IPAddress ip, int port)
{
    //Serial.println("Get IO");

    CoapOption option;   
    for(int i = 0; i<COAP_MAX_OPTION_NUM; i++){
        option = packet.options[i];
        if(!option.length)
            continue;
        if(option.number == COAP_URI_QUERY){
            Serial.print("query at i:");
            Serial.println(i);
            break;
        }

    }
    if(option.number != COAP_URI_QUERY && !option.length){
        return;
        //TODO :coap.sendResponse ??
    }
    char queryOpt[option.length];
    memcpy(queryOpt, option.buffer, option.length);
    queryOpt[option.length] = NULL;
    
    String pin = String(queryOpt).substring(pinPrefixLen);
    bool digital = pin.substring(0,1).equals("D"); // If first char is D => digital pin.
    bool analog = pin.substring(0,1).equals("A"); // If first char is D => digital pin.
    bool i2c = pin.substring(0,3).equals("I2C"); // If first char is D => digital pin.
    int pinNumber; 

    String responseStr = "";
    if(digital){
       pinNumber = pin.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
    }else if(analog){
       pinNumber = pin.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
       responseStr = String("ESP-get-val:"+String(analogRead(pinNumber)) /*+ String(analogRead(pinNumber))*/);
    }else if(i2c){
        float teplota = bmp.readTemperature();
       responseStr = String("ESP-get-val:"+String(teplota) /*+ String(analogRead(pinNumber))*/);
      
    }
    //Serial.println("pin:" + String(pinNumber));
    //Serial.println("read:" + String(analogRead(pinNumber)));
    /*
    Serial.println("len:" + String(sizeof(responseStr)));
    Serial.println("len2:" + String(responseStr.length()));*/
    char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), sizeof(response));
    //response[responseStr.length()] = 0;
    Serial.println("responseStr to return:" + responseStr);
    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}
//netsh interface ip show joins

/**
 * TODO
 * - Není potřeba v callback_get_io() při analog/digital read kontrolovat schopnosti pinů (hlavně teda to analogRead)??
 * 
 * 
 */
