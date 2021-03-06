#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include "user_interface.h"

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
        if(Udp.destinationIP().toString().equals(multicastIP.toString())){
            Serial.println("Received via multicast");
        }else{            
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
    /*
    Serial.println("payload:");
    Serial.println(payload);
    Serial.println("query opt:");
    Serial.println(String(queryOpt));
    Serial.println();
    Serial.println("opt w:");
    Serial.write((packet.options[0].buffer),packet.options[0].length);
    Serial.println();
    Serial.write((packet.options[1].buffer),packet.options[1].length);
    Serial.println("\nkonec opt");*/
    
    Serial.print("PINNN: ");
    Serial.println(pinNumber);
    int valueToSet = payload.toInt();
    pinMode(pinNumber, OUTPUT);
    if(digital){ // Digital pin
        Serial.println(valueToSet);
        if(valueToSet > 512){
            digitalWrite(pinNumber, LOW);
        }
        else{            
            digitalWrite(pinNumber, HIGH);
        }
    }else{ // Analog pin
        analogWrite(pinNumber,valueToSet);
    }

    String str = "set A/D: " + pin.substring(0,1) + ", val: " + valueToSet + ", pin: " + pinNumber;
    char msgToClient[str.length()];
    strncpy(msgToClient, str.c_str(), str.length());
    msgToClient[sizeof(msgToClient) - 1] = 0;
    
    coap.sendResponse(ip, port, packet.messageid, msgToClient, sizeof(msgToClient), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}


// CoAP server endpoint URL 
void callback_get_io(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("Get IO");

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
    
    pinMode(pinNumber, INPUT);
    int val=-1;
    if(digital){ // Digital pin
        val = digitalRead(pinNumber);
    }else{ // Analog pin
        val = analogRead(pinNumber);
    }

    if(val > -1){ // Send result
        String str = "ESP-val:" + val;
        char msgToClient[str.length()];
        strncpy(msgToClient, str.c_str(), str.length());
        msgToClient[sizeof(msgToClient) - 1] = 0;
        
        coap.sendResponse(ip, port, packet.messageid, msgToClient, sizeof(msgToClient), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
    }else{ // Else send error

    }
}
//netsh interface ip show joins

/**
 * TODO
 * - Není potřeba v callback_get_io() při analog/digital read kontrolovat schopnosti pinů (hlavně teda to analogRead)??
 * 
 * 
 */
