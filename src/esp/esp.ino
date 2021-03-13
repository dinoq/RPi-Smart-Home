#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include "user_interface.h"


#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>

#include <Sodaq_SHT2x.h>

#include <EEPROM.h>
 
/**
 * Function prototypes
 * */
void checkMulticast();
void callback_set_io(CoapPacket &packet, IPAddress ip, int port);//??
void callback_get_io(CoapPacket &packet, IPAddress ip, int port);//??
void callback_listen_to(CoapPacket &packet, IPAddress ip, int port);
void callback_reset_RPi_server(CoapPacket &packet, IPAddress ip, int port);
void setRPiIP();
void checkRPiConn();

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



WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 187);
IPAddress RpiIP;
String moduleID;
char incomingPacket[255];                             // buffer for incoming packets
char replyPacket[32]; // a reply string to send back

Coap coap(Udp);
unsigned int CoAPPort = 5683;

/**
 * Others variables
 * */
String inputPrefix = "input=";
int inputPrefixLen = 6;
int lastConnectedToRPi = 0; // Number of seconds from last connection
bool bmpHasBegun = false;
bool watchedIO[20];

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
    Serial.println();
    randomSeed(micros());
    EEPROM.begin(512);  //Initialize EEPROM
    setRPiIP();
    Serial.println();

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
    coap.server(callback_listen_to, "listen-to");
    coap.server(callback_reset_RPi_server, "reset-RPi-server");
    
    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort);
    Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), CoAPPort);

    coap.start();
    
    String multicastMsgPrefix = "RPi-server-IP:";
    int multicastMsgPrefixLen = 14; // Length of string "RPi-server-IP:", which is send via multicast from Raspberry Pi
    
}

// Loop function
void loop()
{
    delay(1000);
    checkRPiConn();
    checkMulticast();
    coap.loop();
    
}

void checkRPiConn(){    
    if (!RpiIP.isSet()) 
        return;

    lastConnectedToRPi++;
    if(lastConnectedToRPi > withoutConnTimeLimit){ // Get connection to Raspberry Pi again
        RpiIP = IPAddress();
    }
}

void checkMulticast()
{
    if (RpiIP.isSet()) // If module is already connected to RPi then skip check of multicast...
        return;
        
    int packetSize = Udp.parsePacket();
    if (packetSize)
    {
        if(!Udp.destinationIP().toString().equals(multicastIP.toString())){// comes from CoAP client (to local IP)            
            return;
        }
        // receive incoming UDP packets
        //Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
        int len = Udp.read(incomingPacket, 255);
        if (len > 0)
        {
            incomingPacket[len] = 0;
            Serial.printf("UDP packet contents: %s\n", incomingPacket);
            bool initialConnection = false; //Determines whether it is first connection or Raspberry Pi tries to reconnect

            String multicastMsgPrefix = "RPi-server-IP:";
            if (len > multicastMsgPrefix.length()){
                String prefix = String(incomingPacket).substring(0, multicastMsgPrefix.length());
                if(prefix.equals(multicastMsgPrefix))
                {
                    String RPiIPStr = String(incomingPacket).substring(multicastMsgPrefix.length());
                    //Serial.println("Zbytek:" + RPiIPStr);
                    RpiIP.fromString(RPiIPStr);
                    int EEPROMAddr = 0;
                    int IpIndex = 0;  
                    lastConnectedToRPi = 0;
                    EEPROM.write(EEPROMAddr++, 'I');    
                    EEPROM.write(EEPROMAddr++, 'P');    
                    EEPROM.write(EEPROMAddr++, ':');  
                    EEPROM.write(EEPROMAddr++, RpiIP[IpIndex++]);    
                    EEPROM.write(EEPROMAddr++, RpiIP[IpIndex++]);       
                    EEPROM.write(EEPROMAddr++, RpiIP[IpIndex++]);    
                    EEPROM.write(EEPROMAddr++, RpiIP[IpIndex++]);        
                    EEPROM.commit();
                }
                if(lastConnectedToRPi > withoutConnTimeLimit && moduleID.length() > 0){ // Case, when IP address was changed (either of Raspberry Pi or of module). Module send back its ID to update in database in case of change
                    ("ID:"+moduleID).toCharArray(replyPacket, sizeof(replyPacket));
                }else{ // Case of initial communication with Raspberry Pi
                    ("TYPE:"+boardType).toCharArray(replyPacket, sizeof(replyPacket));
                }

                Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
                Udp.write(replyPacket);
                Udp.endPacket();
            }
        }
    }
}

// CoAP server endpoint URL 
void callback_set_io(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("Set IO");
    if(!RpiIP.isSet())
      return;

    lastConnectedToRPi = 0;

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
    
    String pin = String(queryOpt).substring(inputPrefixLen);
    bool digital = pin.substring(0,1).equals("D"); // If first char is D => digital pin. Analog otherwise.
    int pinNumber = pin.substring(1).toInt(); //Here we use pin number directly (without constants like A0, D5 etc...)

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;
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
    Serial.println("Get IO");
    if(!RpiIP.isSet())
      return;
      
    lastConnectedToRPi = 0;

    CoapOption option;   
    for(int i = 0; i<COAP_MAX_OPTION_NUM; i++){
        option = packet.options[i];
        if(!option.length)
            continue;
        if(option.number == COAP_URI_QUERY){
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
    
    String input = String(queryOpt).substring(inputPrefixLen);
    bool digital = input.substring(0,1).equals("D"); // If first char is D => digital pin.
    bool analog = input.substring(0,1).equals("A"); // If first char is D => digital pin.
    bool i2c = input.substring(0,3).equals("I2C"); // If first char is D => digital pin.
    int pinNumber; 

    String responseStr = "";
    if(digital){
       pinNumber = input.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
    }else if(analog){
       pinNumber = input.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
       responseStr = String("ESP-get-val:"+String(analogRead(pinNumber)) /*+ String(analogRead(pinNumber))*/);
    }else if(i2c){
        float sensorVal;
        if(!bmpHasBegun){
            if (!bmp.begin(BMP280_ADRESS)) {
                //Serial.println("BMP280 senzor nenalezen");
            }else{
                bmpHasBegun = true;
            }
        }
        if(input.substring(4,10).equals("BMP280")){//eg. "I2C-BMP280-teplota"
            String type = (input.length() >= 18 && input.substring(11,18).equals("teplota"))? "temp" : "press"; //temp or press (temperature/pressure)
            if(type.equals("temp")){
                sensorVal = bmp.readTemperature();
            }else if(type.equals("press")){
                sensorVal = bmp.readPressure();
            }
        }else if(input.substring(4,9).equals("SHT21")){//eg. "I2C-SHT21-teplota"
            String type = (input.length() >= 18 && input.substring(10,17).equals("teplota"))? "temp" : "hum"; //temp or hum (temperature/humidity)
            if(type.equals("temp")){
                sensorVal = SHT2x.GetTemperature();
            }else if(type.equals("hum")){
                sensorVal = SHT2x.GetHumidity();
            }
        }
       responseStr = String("ESP-get-val:"+String(sensorVal) /*+ String(analogRead(pinNumber))*/);
      
    }
    //Serial.println("pin:" + String(pinNumber));
    //Serial.println("read:" + String(analogRead(pinNumber)));
    /*
    Serial.println("len:" + String(sizeof(responseStr)));
    Serial.println("len2:" + String(responseStr.length()));*/
    char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), sizeof(response));
    //response[responseStr.length()] = 0;
    //Serial.println("responseStr to return:" + responseStr);
    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

// CoAP server endpoint URL 
void callback_listen_to(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("listen to");
    if(!RpiIP.isSet())
      return;
      
    lastConnectedToRPi = 0;

    CoapOption option;   
    for(int i = 0; i<COAP_MAX_OPTION_NUM; i++){
        option = packet.options[i];
        if(!option.length)
            continue;
        if(option.number == COAP_URI_QUERY){
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
    
    String input = String(queryOpt).substring(inputPrefixLen);
    bool digital = input.substring(0,1).equals("D"); // If first char is D => digital pin.
    bool analog = input.substring(0,1).equals("A"); // If first char is D => digital pin.
    bool i2c = input.substring(0,3).equals("I2C"); // If first char is D => digital pin.
    int pinNumber; 

    String responseStr = "";
    if(digital){
       pinNumber = input.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
    }else if(analog){
       pinNumber = input.substring(1).toInt();//Here we use pin number directly (without constants like A0, D5 etc...)
       responseStr = String("ESP-get-val:"+String(analogRead(pinNumber)) /*+ String(analogRead(pinNumber))*/);
    }else if(i2c){
        float sensorVal;
        if(!bmpHasBegun){
            if (!bmp.begin(BMP280_ADRESS)) {
                //Serial.println("BMP280 senzor nenalezen");
            }else{
                bmpHasBegun = true;
            }
        }
        if(input.substring(4,10).equals("BMP280")){//eg. "I2C-BMP280-teplota"
            String type = (input.length() >= 18 && input.substring(11,18).equals("teplota"))? "temp" : "press"; //temp or press (temperature/pressure)
            if(type.equals("temp")){
                sensorVal = bmp.readTemperature();
            }else if(type.equals("press")){
                sensorVal = bmp.readPressure();
            }
        }else if(input.substring(4,9).equals("SHT21")){//eg. "I2C-SHT21-teplota"
            String type = (input.length() >= 18 && input.substring(10,17).equals("teplota"))? "temp" : "hum"; //temp or hum (temperature/humidity)
            if(type.equals("temp")){
                sensorVal = SHT2x.GetTemperature();
            }else if(type.equals("hum")){
                sensorVal = SHT2x.GetHumidity();
            }
        }
       responseStr = String("ESP-get-val:"+String(sensorVal) /*+ String(analogRead(pinNumber))*/);
      
    }
    //Serial.println("pin:" + String(pinNumber));
    //Serial.println("read:" + String(analogRead(pinNumber)));
    /*
    Serial.println("len:" + String(sizeof(responseStr)));
    Serial.println("len2:" + String(responseStr.length()));*/
    char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), sizeof(response));
    //response[responseStr.length()] = 0;
    //Serial.println("responseStr to return:" + responseStr);
    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

// CoAP server endpoint URL 
void callback_reset_RPi_server(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("callback_reset_RPi_server");
    char prefix[] = "IP:????";
    int adr = 0;
    for(; adr < sizeof(prefix)-1; adr++){
      EEPROM.write(adr, 0);  
    }      
    EEPROM.commit();
    lastConnectedToRPi = 0;
      Serial.println("ip pred set func:"+String(RpiIP.isSet()));
    RpiIP = IPAddress();
      Serial.println("ip po set func:"+String(RpiIP.isSet()));
}


// CoAP server endpoint URL 
void callback_set_ID(CoapPacket &packet, IPAddress ip, int port)
{
    lastConnectedToRPi = 0;
    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;
    String payload(p);
    moduleID = payload;
    Serial.println("ID:"+String(moduleID));
}
void setRPiIP(){
    char prefix[] = "IP:";
    bool IpIsSaved = true;
    int adr = 0;
    for(; adr < sizeof(prefix)-1; adr++){
      if(EEPROM.read(adr) != prefix[adr]){
        IpIsSaved = false;
        break;
      }
    }
    if(IpIsSaved){
      RpiIP = IPAddress(EEPROM.read(adr++),EEPROM.read(adr++),EEPROM.read(adr++),EEPROM.read(adr++));
      Serial.println("ip IS set:"+RpiIP.toString());
    } else{      
      Serial.println("ip not set:"+RpiIP.toString());
      Serial.print(char(EEPROM.read(0)));
      Serial.print(char(EEPROM.read(1)));
      Serial.print(char(EEPROM.read(2)));
      Serial.print(char(EEPROM.read(3)));
      Serial.print(char(EEPROM.read(4)));   
      Serial.print(char(EEPROM.read(5)));   
      Serial.print(char(EEPROM.read(6)));   
      Serial.print(char(EEPROM.read(7)));   
      Serial.println();
    }

    //Následující cyklus rozdělit podle toho, zda je již v EEPROM něco...
    for(int i = 0; i < sizeof(watchedIO); i++){
        watchedIO[i] = false;
    }
}

//netsh interface ip show joins

/**
 * TODO
 * - Není potřeba v callback_get_io() při analog/digital read kontrolovat schopnosti pinů (hlavně teda to analogRead)??
 * 
 * 
 */
