#include "esp.h"

WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 187);
IPAddress RpiIP;
String moduleID;
char incomingPacket[255]; // buffer for incoming packets
char replyPacket[32];     // a reply string to send back

Coap coap(Udp);
unsigned int CoAPPort = 5683;

/**
 * Others variables
 * */
String inputPrefix = "input=";
int inputPrefixLen = 6;
int lastConnectedToRPi = 0; // Number of seconds from last connection
bool bmpHasBegun = false;
int watchedINIndex = 0;
SensorInfo watched[WATCHED_IN_LIMIT];
Memory mem;
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

    resetFromMemory();
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

    Serial.println("Setup CoAP callbacks");
    coap.server(callback_set_io, "set-io");
    coap.server(callback_listen_to, "listen-to");
    coap.server(callback_reset_module, "reset-module");
    coap.server(callback_set_id, "set-id");

    coap.response(callback_response);

    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort);
    Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), CoAPPort);

    coap.start();

    reset_module();

}
// CoAP client response callback
void callback_response(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("[Coap Response got]");

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    Serial.println(p);
}

// Loop function
void loop()
{
    delay(1000);
    checkRPiConn();
    checkMulticast();
    coap.loop();
    checkInValues();
}

int run = 10;
void checkInValues()
{
    if(run > 0 || true)
    
    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (watched[i].IN != UNSET)
        {
            float newVal = getSensorVal(watched[i]);
            if (newVal != watched[i].val)
            {
                Serial.println("watched[i].val_type");
                Serial.println((byte)watched[i].val_type);
                Serial.println(watched[i].val_type);
                Serial.println("watched[i].IN");
                Serial.println((byte)watched[i].IN);
                Serial.println(watched[i].IN);
                
                char payload[15];
                sprintf(payload, "in:%f%c%c", newVal, watched[i].val_type, (watched[i].IN+1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                Serial.print("valLen: |");
                Serial.println(strlen(payload));
                /*payload[strlen(payload)] = watched[i].val_type;
                Serial.println(strlen(payload));
                payload[strlen(payload)] = watched[i].IN;
                Serial.println(strlen(payload));
                payload[strlen(payload)] = 0;
                Serial.println(strlen(payload));*/
                int msgid = coap.send(IPAddress(192, 168, 1, 4), 5683, "new-value", COAP_NONCON, COAP_PUT, NULL, 0, (uint8_t *)&payload, strlen(payload), COAP_TEXT_PLAIN);
                Serial.println("msgid:");
                Serial.println(msgid);
                Serial.print("newVal: |");
                Serial.println(newVal);
                watched[i].val = newVal;
                run--;
            }
        }
    }
}

SensorInfo getSensorInfo(char input[])
{

    Serial.print("begin getSensorInfoInput::");
    Serial.println(input);
    SensorInfo info;
    bool digital = input[0] == 'D';      // If first char is D => digital pin.
    bool analog = input[0] == 'A';       // If first char is A => analog pin.
    bool i2c = !strncmp(input, "I2C", 3); // If

    Serial.println("A D I2C::");
    Serial.println(String(digital));
    Serial.println(String(analog));
    Serial.println(String(i2c));

    
    Serial.println(String(strncmp(input, "I2C", 3)));
    Serial.println(String(strncmp(input, "I2C", 1)));
    Serial.println(String(strncmp("I2C", "I2C", 3)));
    
    String responseStr = "";
    if (analog || digital)
    {
        char pinStr[3]; // eg. 11\0

        byte pinNumber = (byte)atoi(strncpy(pinStr, input + 1, strlen(input) - 1)); //Here we use pin number directly (without constants like A0, D5 etc...)
        Serial.println("pinNumber");
        Serial.println(pinNumber);
        Serial.println(pinStr);
        Serial.println(input);
        Serial.println(String(analog));
        info.val = (float)(analog) ? analogRead(pinNumber) : digitalRead(pinNumber);
        Serial.println("info.val");
        Serial.println(info.val);
        Serial.println(analogRead(pinNumber));
        Serial.println(analogRead(17));
        info.val_type = (byte)(analog) ? ANALOG : DIGITAL;
        info.IN = pinNumber;
    }
    else if (i2c)
    {
        float val;
        byte IN;

        char t[] = "teplota";
        if (!strncmp(input + 4, "BMP280", strlen("BMP280"))) //eg. "I2C-BMP280-teplota"
        {
            IN = (strlen(input) >= 18 && !strncmp(input + 11, t, strlen(t))) ? BMP280_TEMP : BMP280_PRESS; //temp or press (temperature/pressure)
        }
        else if (!strncmp(input + 4, "SHT21", strlen("SHT21"))) //eg. "I2C-SHT21-teplota"
        {
            IN = (strlen(input) >= 18 && !strncmp(input + 10, t, strlen(t))) ? SHT21_TEMP : SHT21_HUM; //temp or press (temperature/pressure)
        }
        Serial.print("getSensorInfoInput::");
        Serial.println(input);
        Serial.println(strlen("BMP280"));
        Serial.println(String(!strncmp(input + 4, "BMP280", strlen("BMP280"))));

        info.IN = IN;
        info.val_type = (byte)I2C;
        info.val = getI2CVal(IN);
    }

    return info;
}

float getSensorVal(SensorInfo info)
{
    float val = -1.0;
    if (info.val_type == ANALOG || info.val_type == DIGITAL)
    {
        val = (info.val_type == ANALOG) ? analogRead(info.IN) : digitalRead(info.IN);
    }
    else if (info.val_type == I2C)
    {
        val = getI2CVal(info.IN);
    }

    return val;
}

float getI2CVal(byte IN)
{
    float val;
    val = (IN == BMP280_TEMP) ? bmp.readTemperature() : val;
    val = (IN == BMP280_PRESS) ? bmp.readPressure() : val;
    val = (IN == SHT21_TEMP) ? SHT2x.GetTemperature() : val;
    val = (IN == SHT21_HUM) ? SHT2x.GetHumidity() : val;
    val = (IN == UNKNOWN) ? INVALID_SENSOR_VALUE : val;
    return val;
}

void checkRPiConn()
{
    if (!RpiIP.isSet())
        return;

    lastConnectedToRPi++;
    if (lastConnectedToRPi >= withoutConnTimeLimit)
    { // Get connection to Raspberry Pi again
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
        if (!Udp.destinationIP().toString().equals(multicastIP.toString()))
        { // comes from CoAP client (to local IP)
            return;
        }
        // receive incoming UDP packets
        //Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
        int len = Udp.read(incomingPacket, 255);
        if (len > 0)
        {
            incomingPacket[len] = 0;
            Serial.printf("UDP packet contents: %s\n", incomingPacket);

            String multicastMsgPrefix = "RPi-server-IP:";
            if (len > multicastMsgPrefix.length())
            {
                String prefix = String(incomingPacket).substring(0, multicastMsgPrefix.length());
                if (prefix.equals(multicastMsgPrefix))
                {
                    String RPiIPStr = String(incomingPacket).substring(multicastMsgPrefix.length());
                    //Serial.println("Zbytek:" + RPiIPStr);
                    RpiIP.fromString(RPiIPStr);
                    lastConnectedToRPi = 0;
                    mem.writeByte('I');
                    mem.writeByte('P');
                    mem.writeByte(':');
                    mem.writeByte(RpiIP[0]);
                    mem.writeByte(RpiIP[1]);
                    mem.writeByte(RpiIP[2]);
                    mem.writeByte(RpiIP[3]);
                    mem.commit();
                }
                if (lastConnectedToRPi >= withoutConnTimeLimit && moduleID.length() > 0)
                { // Case, when IP address was changed (either of Raspberry Pi or of module). Module send back its ID to update in database in case of change
                    ("ID:" + moduleID).toCharArray(replyPacket, sizeof(replyPacket));
                }
                else
                { // Case of initial communication with Raspberry Pi
                    ("TYPE:" + boardType).toCharArray(replyPacket, sizeof(replyPacket));
                    mem.setAllSensorsInfos(SENSOR_INFO_MEM_ADDR, WATCHED_IN_LIMIT, UNSET, UNSET, UNINITIALIZED_SENSOR_VALUE); // Clear Sensors Infos part of memory
                }
                Serial.println("replyPacket:" + String(replyPacket));
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
    if (!RpiIP.isSet())
        return;

    Serial.println("Set IO");
    lastConnectedToRPi = 0;

    CoapOption option;
    for (int i = 0; i < COAP_MAX_OPTION_NUM; i++)
    {
        option = packet.options[i];
        if (!option.length)
            continue;
        if (option.number == COAP_URI_QUERY)
        {
            Serial.print("query at i:");
            Serial.println(i);
            break;
        }
    }
    if (option.number != COAP_URI_QUERY && !option.length)
    {
        return;
        //TODO :coap.sendResponse ??
    }
    char queryOpt[option.length];
    memcpy(queryOpt, option.buffer, option.length);
    queryOpt[option.length] = NULL;

    String pin = String(queryOpt).substring(inputPrefixLen);
    bool digital = pin.substring(0, 1).equals("D"); // If first char is D => digital pin. Analog otherwise.
    int pinNumber = pin.substring(1).toInt();       //Here we use pin number directly (without constants like A0, D5 etc...)

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;
    String payload(p);

    int valueToSet = payload.toInt();
    pinMode(pinNumber, OUTPUT);
    if (digital)
    { // Digital pin
        Serial.println(valueToSet);
        if (valueToSet > 512)
        {
            digitalWrite(pinNumber, LOW);
            Serial.println("LOW" + String(pinNumber));
        }
        else
        {
            digitalWrite(pinNumber, HIGH);
            Serial.println("HEIGHT" + String(pinNumber));
        }
    }
    else
    { // Analog pin
        analogWrite(pinNumber, valueToSet);
        Serial.println("ANALOG:" + String(valueToSet));
    }

    /*String responseStr = "set A/D: " + pin.substring(0, 1) + ", val: " + valueToSet + ", pin: " + pinNumber;
    char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), responseStr.length());
    response[sizeof(response) - 1] = 0;

    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);*/

    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

// CoAP server endpoint URL
void callback_listen_to(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
        return;

    Serial.println("listen to");
    lastConnectedToRPi = 0;

    CoapOption option;
    for (int i = 0; i < COAP_MAX_OPTION_NUM; i++)
    {
        option = packet.options[i];
        if (!option.length)
            continue;
        if (option.number == COAP_URI_QUERY)
        {
            break;
        }
    }
    if (option.number != COAP_URI_QUERY && !option.length)
    {
        return;
        //TODO :coap.sendResponse ??
    }
    char queryOpt[option.length];
    memcpy(queryOpt, option.buffer, option.length);
    queryOpt[option.length] = NULL;

    String input = String(queryOpt).substring(inputPrefixLen);
    const byte len = input.length()+1;
    char inputCh[len];
    input.toCharArray(inputCh, len); 
    if(inputCh[0] == 'D')
        pinMode(17, INPUT);  
    SensorInfo info = getSensorInfo(inputCh);
    if((info.IN == BMP280_TEMP || info.IN == BMP280_PRESS)){      
      if (!bmp.begin(BMP280_ADRESS))
      {
          Serial.println("BMP280 senzor nenalezen");
      }else{
          Serial.println("BMP280 inited");
      }
    }
    if(!alreadyWatched(info)){
      Serial.println("unikátni listem");
      watched[watchedINIndex++] = info;
    }else{
      Serial.println("NEEEEEunikátni listem");
    }
    /*Serial.println("str conversion");
    Serial.println(input.length());
    Serial.println(input);
    Serial.println(inputCh);
    Serial.println(strlen(inputCh));
    Serial.println(len);*/
    Serial.println("watched");
    Serial.println(watchedINIndex-1);
    Serial.println(watched[watchedINIndex-1].IN);
    Serial.println(watched[watchedINIndex-1].val);
    Serial.println(watched[watchedINIndex-1].val_type);
    

    /*char response[responseStr.length()];
    strncpy(response, responseStr.c_str(), sizeof(response));

    coap.sendResponse(ip, port, packet.messageid, response, sizeof(response), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);*/

    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

bool alreadyWatched(SensorInfo sInfo){
  for(int i = 0; i < watchedINIndex/*WATCHED_IN_LIMIT*/; i++){
    if(watched[i].IN == sInfo.IN 
      && watched[i].val_type == sInfo.val_type){
      return true;
    }
  }
  return false;
}

// CoAP server endpoint URL for setting module ID (from database)
void callback_set_id(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
        return;

    Serial.println("callback_set_id");

    lastConnectedToRPi = 0;

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;
    String payload(p);
    Serial.println("Nastavené ID: " + payload);
    moduleID = payload;
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

// CoAP server endpoint URL for complet reset of module
void callback_reset_module(CoapPacket &packet, IPAddress ip, int port)
{
    reset_module(); // Parameters are not need when reseting module
}

void reset_module()
{
    //if (!RpiIP.isSet())
    //    return;

    Serial.println("reset_module");

    // Clear memory
    mem.clear(0, SENSOR_INFO_MEM_ADDR - 1);
    mem.setAllSensorsInfos(SENSOR_INFO_MEM_ADDR, WATCHED_IN_LIMIT, UNSET, UNSET, UNINITIALIZED_SENSOR_VALUE);
    mem.clear(SENSOR_INFO_MEM_ADDR + 20 * WATCHED_IN_LIMIT, USED_MEM_END);

    //TODO: Smazat i ID
    lastConnectedToRPi = withoutConnTimeLimit; // We know here, that there will be no connection from Raspberry Pi
    RpiIP = IPAddress();
}

void updateMemory()
{
}

//Flash structure: IP:????SInfo:(byte+byte+float)*20ID:(byte)*20 [ID is 20 chars in firebase]
void resetFromMemory()
{
    char prefix[] = "IP:";
    bool inMemory = true;
    int adr = 0;
    for (; adr < sizeof(prefix) - 1; adr++)
    {
        if (mem.readByte() != prefix[adr])
        {
            inMemory = false;
            break;
        }
    }
    if (inMemory)
    {
        RpiIP = IPAddress(mem.readByte(), mem.readByte(), mem.readByte(), mem.readByte());
        Serial.println("ip IS set:" + RpiIP.toString());
    }
    else
    {
        Serial.println("ip not set:" + RpiIP.toString());
        Serial.println();
    }

    for (; adr < WATCHED_IN_LIMIT; adr++)
    {
        if (inMemory)
        {
            watched[adr].IN = mem.readByte();
            watched[adr].val_type = mem.readByte();
            watched[adr].val = mem.readFloat();
            if(watched[adr].IN != UNSET)
                watchedINIndex++;
        }
        else
        {
            watched[adr].IN = UNSET;
            watched[adr].val_type = UNSET;
            watched[adr].val = UNINITIALIZED_SENSOR_VALUE;
        }
    }

    if (inMemory)
    {
        prefix[1] = 'D'; // reuse variable, change "IP:" => "ID:"
        for (int i = 0; i < sizeof(prefix) - 1; i++)
        {
            if (mem.readByte() != prefix[i])
            {
                inMemory = false;
                break;
            }
        }
        if (inMemory)
        {
            char ch;
            while ((ch = mem.readByte()) != 0)
            {
                moduleID += ch;
            }
            moduleID += (char)0;
        }
        else
        {
            moduleID = "";
        }
    }
}

//netsh interface ip show joins

/**
 * TODO
 * - Není potřeba v callback_get_io() při analog/digital read kontrolovat schopnosti pinů (hlavně teda to analogRead)??
 * 
 * 
 */
