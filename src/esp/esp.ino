#include "esp.h"

WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 187);
IPAddress RpiIP;
String moduleID;
char incomingPacket[255]; // buffer for incoming packets

Coap coap(Udp);
unsigned int CoAPPort = 5683;

String inputPrefix = "input=";
int inputPrefixLen = 6;
int lastConnectedToRPi = 0; // Number of seconds from last connection

bool BMP280Begun = false;
bool wireBegun = false;

int watchedINIndex = 0;
SensorInfo watched[WATCHED_IN_LIMIT];
Memory mem;
bool IO_Inited = false;
/**
   BMP280
*/
#define BMP280_ADRESS (0x76)
Adafruit_BMP280 bmp;

/**

   Functions implementations
 * */

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
    coap.server(callbackSetOutput, "set-output");
    coap.server(callbackObserveInput, "observe-input");
    coap.server(callbackStopInputObservation, "stop-input-observation");
    coap.server(callbackChangeObservedInput, "change-observed-input");
    coap.server(callbackResetModule, "reset-module");
    coap.server(callbackServerHasBeenReset, "server-has-been-reset");
    coap.server(callbackHelloClient, "hello-client");
    coap.server(callbackSetID, "set-id");
    
    coap.response(callback_response);


    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort); // In order to enable listening on multicast
    //Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), CoAPPort);

    coap.start();

    resetFromMemory();
    Serial.println("Memory after resetFromMemory()");
    printMemory("Memory on init");
    Serial.println();
    
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LED_BUILTIN_LOW);

    // Uncomment if you want to completely reset module on start (not recommended!)...
    //resetModule();
}

// Loop function
void loop()
{
    blinkIfNotConnectedAndDelay();
    //checkRPiConn();
    coap.loop();
    if(checkIO_Inited()){
        checkInValues();
    }
}

byte valToBlink = 0;
void blinkIfNotConnectedAndDelay(){
    if (RpiIP.isSet()){
        delay(SENSOR_CHECK_TIME);
        return;
    }
    int lightOffTime = 900 ;
    int lightOnTime = 50;

    digitalWrite(LED_BUILTIN, LED_BUILTIN_HIGH);
    delay(lightOnTime);
    digitalWrite(LED_BUILTIN, LED_BUILTIN_LOW);
    delay(lightOffTime);   

}

void blinkFast(){
    int blinkDelay = 100;

    //blink with builtin led
    for(int i = 0; i < 5; i++){
        digitalWrite(LED_BUILTIN, LED_BUILTIN_HIGH);
        delay(blinkDelay);
        digitalWrite(LED_BUILTIN, LED_BUILTIN_LOW);
        delay(blinkDelay);
    }
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

/**
 * Function check if are IO pins (in sense of sensors/devices) initialized and send request to server to get all IO if needed
 * @returns Whether are IO pins (in sense of sensors/devices) initialized
 */
bool checkIO_Inited(){
    if(IO_Inited) //  or IO is already inited, then return true
        return true;
    else if(!RpiIP.isSet() || moduleID.length() == 0 ) // If RPiIP or module id is not inited, return false
        return false;  

        
    Serial.println("Init IO (send coap msg to server)");
    int msgid = coap.send(RpiIP, CoAPPort, "get-all-IO-state", COAP_NONCON, COAP_GET, NULL, 0, NULL, 0, COAP_TEXT_PLAIN);
    return false;  
}


void checkInValues()
{
    if (!IO_Inited)
        return;    

    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (watched[i].IN != UNSET)
        {
            float newVal = getSensorVal(watched[i]);
            Serial.println("watched[i].IN");
                Serial.println((byte)watched[i].IN);
                Serial.println("val, newval: "+String(watched[i].val)+"," + String(newVal));
            if (isDifferentEnough(newVal, watched[i].val, watched[i]))
            {
                /*Serial.println("watched[i].IN");
                Serial.println((byte)watched[i].IN);
                Serial.println("val, newval: "+String(watched[i].val)+"," + String(newVal));*/

                char payload[32];
                float valToSend = (watched[i].val_type == DIGITAL && (newVal > 0)) ? 1023 : newVal; // if digital, map value from 0/1 to 0/1023 (because client interpret digital values this way). Else send newVal
/*
                if (watched[i].IN >= BMP280_TEMP && watched[i].IN <= SHT21_HUM)
                {                                                                                         // sprintf %.1f in order to display only 1 digit after decimal point for specified inputs
                    sprintf(payload, "in:%.1f%c%c", valToSend, watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                }
                else
                {
                    sprintf(payload, "in:%f%c%c", valToSend, watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                }*/
                if(valToSend == INVALID_SENSOR_VALUE){ // send ?? instead of value
                    sprintf(payload, "in:??%c%c", watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                }else{
                    sprintf(payload, "in:%f%c%c", valToSend, watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                }
                

                COAP_TYPE confirmable = (watched[i].val == UNITIALIZED_SENSOR_VALUE)? COAP_CON : COAP_NONCON; // If sensor value was uninitialized, send msg as confirmable!
                int msgid = coap.send(RpiIP, CoAPPort, "new-value", confirmable, COAP_PUT, NULL, 0, (uint8_t *)&payload, strlen(payload), COAP_TEXT_PLAIN);

                watched[i].val = newVal;
            }
        }
    }
}

float getSensorVal(SensorInfo sInfo)
{
    return getSensorVal(sInfo.val_type, sInfo.IN);
}

float getSensorVal(byte val_type, byte IN)
{
    float val = -1.0;
    if (val_type == ANALOG || val_type == DIGITAL)
    {
        val = (val_type == ANALOG) ? analogRead(IN) : digitalRead(IN);
    }
    else if (val_type == I2C)
    {
        val = getI2CVal(IN);
    }

    return val;
}

/**
   Function reads and returns sensor value (specified by IN)
*/
float getI2CVal(byte IN)
{
    float val = INVALID_SENSOR_VALUE;
    if(IN == BMP280_TEMP){
        val = bmp.readTemperature();
        if(val == 0.00){ // sensor BMP280 maybe was not initialized
            val = (beginBMP(true))? bmp.readTemperature() : INVALID_SENSOR_VALUE;
        }
    }else if(IN == BMP280_PRESS){
        val = (bmp.readPressure()/100.00) + 32;
        if(val == 32.00){ // sensor BMP280 maybe was not initialized
            val = (beginBMP(true))? (bmp.readPressure()/100.00) + 32 : INVALID_SENSOR_VALUE;
        }
    }else if(IN == SHT21_TEMP){
        beginWireIfNotBegun();
        val = SHT2x.GetTemperature();
        if(val == -273.00){ // sensor is not properly connected
            val = INVALID_SENSOR_VALUE;
        }
    }else if(IN == SHT21_HUM){
        beginWireIfNotBegun();
        val = SHT2x.GetHumidity();
        if(val == 0.00){ // sensor is not properly connected
            val = INVALID_SENSOR_VALUE;
        }
    }else
    {
        Serial.printf("-CHYBA: Neznámý vstup sběrnice I2C (%d) ve funkci getI2CVal(byte IN). Přidejte konstatu do výčtu IN_TYPE a upravte funkci!\n", IN);
    }

    return val;
}

/**
   Function determine and returns if new value is different enough from old value to send it to server (we don't want to send to server for example when temperature changes by 0.001 °C)
*/
bool isDifferentEnough(float newVal, float oldVal, SensorInfo sInfo)
{
    float diff = fabs(oldVal - newVal);
    byte oneDecimalPoint[] = {BMP280_TEMP, SHT21_TEMP, SHT21_HUM};
    byte noDecimal[] = {BMP280_PRESS};

    if (valueIsIn(sInfo.IN, oneDecimalPoint))
    {
        return (diff >= 0.1);
    }
    else if (valueIsIn(sInfo.IN, noDecimal))
    {
        return (diff >= 1);
    }
    else if (sInfo.IN >= 0 && sInfo.IN < BMP280_TEMP)
    {
        if (sInfo.val_type == ANALOG)
            return (diff >= 20); // For pins consider 20 as enough difference
        else if (sInfo.val_type == DIGITAL)
            return (diff >= 1); // For pins consider 1 as enough difference
        else
            Serial.printf("-CHYBA: SensorInfo se vstupem %d neni typu ANALOG(=1)/DIGITAL(=2), ale %d!\n", sInfo.IN, sInfo.val_type);
    }
    else
    {
        Serial.printf("-CHYBA: Neznámá hodnota (%i) ve funkci isDifferentEnough(). Přidejte konstantu do výčtu IN_TYPE a upravte funkci.\n", sInfo.IN);
    }

    return false;
}

/**
   Function check if array arr contains value val
*/
bool valueIsIn(byte val, byte arr[])
{
    for (int i = 0; i < (sizeof(arr) / sizeof(arr[0])); i++)
    {
        if (arr[i] == val)
            return true;
    }
    return false;
}

/**
   Called when Raspberry Pi server is looking for new module.
   It can't save Raspberry Pi IP address. It is saved after Server accept response and send module new ID.
   So IP is saved in function callbackSetID()
*/
void callbackHelloClient(CoapPacket &packet, IPAddress ip, int port)
{
    if (RpiIP.isSet()) // If RPi IP is set, we don't want to init communication again (or with another server)
        return;

    Serial.println("callbackHelloClient");

    lastConnectedToRPi = 0;

    char replyPacket[40]; // a reply string to send back
    ("TYPE:" + boardType).toCharArray(replyPacket, sizeof(replyPacket));
    coap.sendResponse(ip, port, packet.messageid, replyPacket, strlen(replyPacket), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen); // Send response to server from which came hello-client msg
}

/**
   Called when server choosed module as new module and send to it its new ID. Now module can save server IP.
*/
void callbackSetID(CoapPacket &packet, IPAddress ip, int port)
{
    if (moduleID.length() > 0 || RpiIP.isSet()) // If module ID or RPi IP is set, we don't want to init communication again (or with another server)
        return;

    Serial.println("callbackSetID");

    setRPiIP(ip);

    lastConnectedToRPi = 0;

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    setModuleID(p, packet.payloadlen + 1);// packet.payloadlen + 1 bacause of NULL terminator

    // We dont need to call resetSensorInfos(), because sensor infos is reset on module start and also when server send CoAP request to /reset-module
    IO_Inited = true; // IO is "inited" (with no sensors and devices)

    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);

    blinkFast();
}

void setRPiIP(IPAddress ip)
{
    RpiIP = ip;

    //Also write to memory
    mem.addr = 0; // set address pointer to begining
    mem.writeByte('I');
    mem.writeByte('P');
    mem.writeByte(':');
    mem.writeByte(RpiIP[0]);
    mem.writeByte(RpiIP[1]);
    mem.writeByte(RpiIP[2]);
    mem.writeByte(RpiIP[3]);
    mem.commit();

    printMemory("mem po nastaveni RPiPI:");
}

void setModuleID(char ID[], byte idLen)
{
    //save to flash memory...
    mem.addr = ID_MEM_ADDR;
    mem.writeByte('I');
    mem.writeByte('D');
    mem.writeByte(':');
    for (int i = 0; i < idLen; i++)
    {
        mem.writeByte(ID[i]);
    }
    mem.commit();

    moduleID = String(ID);
    Serial.println("Nastavené ID: " + moduleID);

    printMemory("mem po nastaveni module ID:");
}

void resetSensorInfos()
{
    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        watched[i].IN = UNSET;
        watched[i].val_type = UNSET;
        watched[i].val = UNITIALIZED_SENSOR_VALUE;
    }
}

// CoAP server endpoint URL for complete reset of module
void callbackResetModule(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
        return;

    Serial.println("callbackResetModule");
    resetModule(); // Parameters packet, ip and port are not need when reseting module
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen); // Send response back to ip, because RPiIP is no longer set!
}

// CoAP server endpoint URL for 
void callbackServerHasBeenReset(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
        return;

    Serial.println("callbackServerHasBeenReset");
    TODO!
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen); // Send response back to ip, because RPiIP is no longer set!
}

void resetModule()
{
    Serial.println("resetModule");

    // Clear memory
    mem.clear(0, USED_MEM_END);

    RpiIP = IPAddress();
    moduleID = "";

    //Also reset all sensors info...
    resetSensorInfos();
    IO_Inited = false;
    
    blinkFast();
}

// CoAP server endpoint URL
void callbackSetAllIO(CoapPacket &packet, IPAddress ip, int port)
{
    if (IO_Inited)
        return;

    Serial.println("callbackSetAllIO");

    lastConnectedToRPi = 0;

    resetSensorInfos();

    CoapOption optionIN;
    CoapOption optionOUT;
    CoapOption option;
    byte optionNum = 0;
    for (int i = 0; i < packet.optionnum; i++)
    {
        option = packet.options[i];
        if (!option.length)
            continue;
        if (option.number == COAP_URI_QUERY)
        {
            if (optionNum == 0)
            {
                optionIN = option;
                optionNum++;
            }
            else
            {
                optionOUT = option;
            }
        }
    }
    //char *strIN;//[optionIN.length];
    char strIN[optionIN.length];
    memcpy(strIN, optionIN.buffer, optionIN.length);
    strIN[optionIN.length] = NULL;
    Serial.println("strIN:" + String(strIN));

    char strOUT[optionOUT.length];
    memcpy(strOUT, optionOUT.buffer, optionOUT.length);
    strOUT[optionOUT.length] = NULL;
    Serial.println("strOUT:" + String(strOUT));

    //parse and init sensors...
    char *input;
    input = strtok(strIN, ":|");
    watchedINIndex = 0;
    while (input)
    {
        if (strncmp(input, "IN", 2))
        {
            SensorInfo info = getSensorInfo(input);
            Serial.println("infoinfoinfoinfo");
            Serial.println(info.IN);
            info.val = UNITIALIZED_SENSOR_VALUE; // Uninitialize value in order to get (send) value at next calling of checkInValues() in loop()
            if (!alreadyWatched(info))
            {
                watched[watchedINIndex++] = info;
                if (info.val_type == DIGITAL || info.val_type == ANALOG)
                {
                    pinMode(info.IN, INPUT);
                }
            }
        }
        input = strtok(NULL, "|");
    }

    //parse and init devices...
    char *output;
    output = strtok(strOUT, ":");
    if (!strncmp(output, "OUT", 3))
    {
        output = strtok(NULL, "="); //get next output
        while (output)
        {

            bool digital = output[0] == 'D'; // If first char is D => digital pin. Analog otherwise.
            char pinNumStr[3];
            strcpy(pinNumStr, output + 1);
            int pinNumber = atoi(pinNumStr);

            output = strtok(NULL, "|"); //get value
            int valueToSet = atoi(output);
            output = strtok(NULL, "="); //get next output

            pinMode(pinNumber, OUTPUT);
            if (digital)
            { // Digital pin
                if (valueToSet > 512)
                {
                    digitalWrite(pinNumber, H);
                    Serial.println("HIGH" + String(pinNumber));
                }
                else
                {
                    digitalWrite(pinNumber, L);
                    Serial.println("LOW" + String(pinNumber));
                }
            }
            else
            { // Analog pin
                analogWrite(pinNumber, valueToSet);
                Serial.println("ANALOG:" + String(valueToSet));
            }
        }
    }

    IO_Inited = true;

    //This msg from server is non comfirmable => don't send response...
    //coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);

    return;
}

// CoAP server endpoint URL
void callbackSetOutput(CoapPacket &packet, IPAddress ip, int port)
{
    if (!IO_Inited)
        return;

    Serial.println("callbackSetOutput");

    lastConnectedToRPi = 0;

    CoapOption option;
    for (int i = 0; i < packet.optionnum; i++)
    {
        option = packet.options[i];
        if (!option.length)
            continue;
        if (option.number == COAP_URI_QUERY)
        {
            break;
        }
    }
    if (packet.optionnum == 0 || option.number != COAP_URI_QUERY)
    {
        return;
        //TODO :coap.sendResponse ??
    }
    char queryOpt[option.length];
    memcpy(queryOpt, option.buffer, option.length);
    queryOpt[option.length] = NULL;
    Serial.println("queryOpt: " + String(queryOpt));

    byte pinPrefixLen = 4;
    String pin = String(queryOpt).substring(pinPrefixLen);
    bool digital = pin.substring(0, 1).equals("D"); // If first char is D => digital pin. Analog otherwise.
    int pinNumber = pin.substring(1).toInt();       //Here we use pin number directly (without constants like A0, D5 etc...)

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    int valueToSet = atoi(p);
    pinMode(pinNumber, OUTPUT);
    if (digital)
    { // Digital pin
        if (valueToSet > 512)
        {
            digitalWrite(pinNumber, H);
            Serial.println("HIGH" + String(pinNumber));
        }
        else
        {
            digitalWrite(pinNumber, L);
            Serial.println("LOW" + String(pinNumber));
        }
    }
    else
    { // Analog pin
        analogWrite(pinNumber, valueToSet);
        Serial.println("ANALOG:" + String(valueToSet));
    }

    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
    return;
}

// CoAP server endpoint URL
void callbackObserveInput(CoapPacket &packet, IPAddress ip, int port)
{
    if (!IO_Inited)
        return;

    Serial.println("observe input");
    lastConnectedToRPi = 0;

    CoapOption option;
    for (int i = 0; i < packet.optionnum; i++)
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
    const byte len = input.length() + 1;
    char inputCh[len];
    input.toCharArray(inputCh, len);
    SensorInfo info = getSensorInfo(inputCh);
    
    //Odešleme okamžitou "odpověď" s hodnotou serveru
    char payload[32];
    float newVal = getSensorVal(info);
    float valToSend = (info.val_type == DIGITAL && (newVal > 0)) ? 1023 : newVal; // if digital, map value from 0/1 to 0/1023 (because client interpret digital values this way). Else send newVal
    if(valToSend == INVALID_SENSOR_VALUE){ // send ?? instead of value
        sprintf(payload, "in:??%c%c", info.val_type, (info.IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
    }else{
        sprintf(payload, "in:%f%c%c", valToSend, info.val_type, (info.IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
    }
    int msgid = coap.send(RpiIP, CoAPPort, "new-value", COAP_CON, COAP_PUT, NULL, 0, (uint8_t *)&payload, strlen(payload), COAP_TEXT_PLAIN);

    //Přidáme do pole sledovaných vstupů...
    if (!alreadyWatched(info)) // Není potřeba hlídat duplikáty...
    {
        Serial.println("unikátni listen");
        info.val = UNITIALIZED_SENSOR_VALUE;
        watched[watchedINIndex++] = info;
        if (info.val_type == DIGITAL || info.val_type == ANALOG)
        {
            pinMode(info.IN, INPUT);
        }

        Serial.println("watched");
        Serial.println(watchedINIndex - 1);
        Serial.println(watched[watchedINIndex - 1].IN);
        Serial.println(watched[watchedINIndex - 1].val);
        Serial.println(watched[watchedINIndex - 1].val_type);
    }

    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
    return;
}

// CoAP server endpoint URL
void callbackStopInputObservation(CoapPacket &packet, IPAddress ip, int port)
{
    if (!IO_Inited)
        return;

    Serial.println("callbackStopInputObservation");
    lastConnectedToRPi = 0;

    CoapOption option;
    for (int i = 0; i < packet.optionnum; i++)
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
    const byte len = input.length() + 1;
    char inputCh[len];
    input.toCharArray(inputCh, len);
    SensorInfo info = getSensorInfo(inputCh);

    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (watched[i].IN == info.IN && watched[i].val_type == info.val_type)
        {
            for (int j = i; j < (WATCHED_IN_LIMIT - 1); j++)
            { //remove old watched IN from watched array
                watched[j].IN = watched[j + 1].IN;
                watched[j].val_type = watched[j + 1].val_type;
                watched[j].val = watched[j + 1].val;
            }

            watched[WATCHED_IN_LIMIT - 1].IN = UNSET;
            watched[WATCHED_IN_LIMIT - 1].val_type = UNSET;
            watched[WATCHED_IN_LIMIT - 1].val = UNITIALIZED_SENSOR_VALUE;
        }
    }

    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
    return;
}
SensorInfo getSensorInfo(char input[])
{

    Serial.print("begin getSensorInfoInput::");
    Serial.println(input);
    SensorInfo info;
    bool digital = input[0] == 'D';       // If first char is D => digital pin.
    bool analog = input[0] == 'A';        // If first char is A => analog pin.
    bool i2c = !strncmp(input, "I2C", 3); // If

    /*Serial.println("A D I2C::");
    Serial.println(String(digital));
    Serial.println(String(analog));
    Serial.println(String(i2c));
    Serial.println(String(strncmp(input, "I2C", 3)));
    Serial.println(String(strncmp(input, "I2C", 1)));
    Serial.println(String(strncmp("I2C", "I2C", 3)));
  */

    String responseStr = "";
    if (analog || digital)
    {
        char pinStr[3]; // eg. 11\0

        byte pinNumber = (byte)atoi(strncpy(pinStr, input + 1, strlen(input) - 1)); //Here we use pin number directly (without constants like A0, D5 etc...)
        Serial.println("pinNumber");
        Serial.println(pinNumber);
        Serial.println("Analog? " + String(analog));
        //Serial.println(pinStr);
        //Serial.println(input);
        info.val = (float)(analog) ? analogRead(pinNumber) : digitalRead(pinNumber);
        /*Serial.println("info.val");
      Serial.println(info.val);
      Serial.println(analogRead(pinNumber));
      Serial.println(analogRead(17));*/
        info.val_type = (byte)(analog) ? ANALOG : DIGITAL;
        info.IN = (byte)pinNumber;
        Serial.println("(byte)pinNumber...");
        Serial.println(info.IN);
    }
    else if (i2c)
    {
        float val;
        byte IN;

        char t[] = "teplota";
        if (!strncmp(input + 4, "BMP280", strlen("BMP280"))) //eg. "I2C-BMP280-teplota"
        {
            IN = (strlen(input) >= 18 && !strncmp(input + 11, t, strlen(t))) ? BMP280_TEMP : BMP280_PRESS; //temp or press (temperature/pressure)
            beginBMP();
            
        }
        else if (!strncmp(input + 4, "SHT21", strlen("SHT21"))) //eg. "I2C-SHT21-teplota"
        {
            IN = (strlen(input) >= 17 && !strncmp(input + 10, t, strlen(t))) ? SHT21_TEMP : SHT21_HUM; //temp or press (temperature/pressure)
            beginWireIfNotBegun();
        }
        else
        {
            Serial.println("-CHYBA: Neznámý vstup sběrnice I2C ve funkci getSensorInfo(char input[]). Přidejte konstatu do výčtu IN_TYPE a upravte funkci!");
        }

        info.IN = IN;
        info.val_type = (byte)I2C;
        info.val = getI2CVal(IN);
    }
    else
    {
        sendErrorReportToServer("Neznámý vstup ve funkci getSensorInfo(char input[])! Možné hodnoty jsou A/D/I2C. Případně přidejte nové.", __PRETTY_FUNCTION__);
        Serial.println("-Chyba: neznámý vstup ve funkci getSensorInfo(char input[])! Možné hodnoty jsou A/D/I2C. Případně přidejte nové.");
    }

    return info;
}

bool alreadyWatched(SensorInfo sInfo)
{
    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (watched[i].IN == sInfo.IN && watched[i].val_type == sInfo.val_type)
        {
            return true;
        }
    }
    return false;
}

// CoAP server endpoint URL
void callbackChangeObservedInput(CoapPacket &packet, IPAddress ip, int port)
{
    if (!IO_Inited)
        return;

    Serial.println("callbackChangeObservedInput");
    lastConnectedToRPi = 0;

    CoapOption oldInOption;
    CoapOption newInOption;
    CoapOption option;
    byte optionNum = 0;
    for (int i = 0; i < packet.optionnum; i++)
    {
        option = packet.options[i];
        if (!option.length)
            continue;
        if (option.number == COAP_URI_QUERY)
        {
            if (optionNum == 0)
            {
                oldInOption = option;
                optionNum++;
            }
            else
            {
                newInOption = option;
            }
        }
    }
    char oldIN[oldInOption.length];
    memcpy(oldIN, oldInOption.buffer, oldInOption.length);
    oldIN[oldInOption.length] = NULL;

    char newIN[newInOption.length];
    memcpy(newIN, newInOption.buffer, newInOption.length);
    newIN[newInOption.length] = NULL;

    Serial.println("oldIN:" + String(oldIN)); 
    Serial.println("newIN:" + String(newIN));

    SensorInfo oldInfo = getSensorInfo(oldIN+4);// +4 because we want to "remove" beginning of the string ("old=")
    SensorInfo newInfo = getSensorInfo(newIN+4);// +4 because we want to "remove" beginning of the string ("new=")
    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (watched[i].IN == oldInfo.IN && watched[i].val_type == oldInfo.val_type)
        {
            watched[i].IN = newInfo.IN;
            watched[i].val_type = newInfo.val_type;
            if (watched[i].val_type == DIGITAL || watched[i].val_type == ANALOG)
            {
                pinMode(watched[i].IN, INPUT);
            }

            Serial.println(String(oldInfo.IN) + " nahrazuji za: " + String(newInfo.IN));
            Serial.println(String(oldInfo.val_type) + " (typ)nahrazuji za: " + String(newInfo.val_type));
        }
    }

    coap.sendResponse(RpiIP, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

//Flash structure: IP:????SInfo:(byte+byte+float)*20ID:(byte)*20 [ID is 20 chars in firebase]
void resetFromMemory()
{
    char prefixIP[] = "IP:";
    char prefixSInfo[] = "SInfo:";
    char prefixID[] = "ID:";
    bool ipInMemory = true;

    mem.addr = 0;
    int i = 0;

    //Is "IP:" in memory?
    for (; i < sizeof(prefixIP) - 1; i++)
    {
        if (mem.readByte() != prefixIP[i])
        {
            ipInMemory = false;
            break;
        }
    }
    if (ipInMemory)
    {
        RpiIP = IPAddress(mem.readByte(), mem.readByte(), mem.readByte(), mem.readByte());
        Serial.println("RpiIP IS set:" + RpiIP.toString());
    }
    else
    {
        Serial.println("RpiIP not set!");
    }

    resetSensorInfos();

    bool idInMemory = false;
    if (ipInMemory) // If IP is not in memory, ID is also not there...
    {
        idInMemory = true;
        mem.addr = ID_MEM_ADDR;
        //Is "ID:" in memory?
        for (i = 0; i < sizeof(prefixID) - 1; i++)
        {
            byte b = mem.readByte();
            if (b != prefixID[i])
            {
                Serial.println("moduleID in memory! fails at: " + String(i) + ", is:" + String(b) + "(at addr: " + String((byte)(mem.addr - 1)) + "), should be" + String(prefixID[i]));
                idInMemory = false;
                break;
            }
        }
    }

    if (idInMemory) // If "ID:" had been found in memory, get ID, which follows
    {
        Serial.println("moduleID in memory!");
        char ch;
        while ((ch = mem.readByte()) != 0)
        {
            moduleID += ch;
        }
        moduleID += (char)0;
    }
    else // If ID is not in memory, clear it!
    {
        Serial.println("moduleID NOT in memory!");
        moduleID = "";
    }

    checkIO_Inited();
}

void printMemory(String msg)
{

    mem.addr = 0;
    Serial.println(msg);
    for (int i = 0; i < USED_MEM_END; i++)
    {

        Serial.print((int)mem.readByte());
        Serial.print(", ");
    }
    Serial.println();
    mem.addr = 0;
    for (int i = 0; i < USED_MEM_END; i++)
    {

        Serial.print((char)mem.readByte());
        Serial.print(", ");
    }
    Serial.println();
}


// CoAP client response callback
void callback_response(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Coap Response got]");
  //This function must be here in order to send CoAP messages to CoAP server
}

void beginWireIfNotBegun(){    
    if(!wireBegun){
        Wire.begin();
        wireBegun = true;
    }
}

boolean beginBMP(boolean forceBegin){
    if(forceBegin || !BMP280Begun){        
        if (!bmp.begin(BMP280_ADRESS))
        {
            Serial.println("BMP280 senzor nenalezen");
            BMP280Begun = false;
        }
        else
        {
            Serial.println("BMP280 senzor nalezen");
            BMP280Begun = true;
        }
    }
    return BMP280Begun;
}

boolean beginBMP(){   
    return beginBMP(false);
}

/**
 * do func name by se mělo vždy přiřazovat __PRETTY_FUNCTION__! 
 */
void sendErrorReportToServer(char errorMsg[], const char funcName[]){
    String msgToSend = String(errorMsg) + ". Ve funkci: " + String(funcName) + ".";
    if (!RpiIP.isSet()){
        Serial.println("Došlo k chybě: " + String(errorMsg) + ". Ve funkci: " + String(funcName) + ".Adresa serveru není nastavená, nebylo možné mu odeslat hlášení o chybě!");
        return;
    }
    char buf[msgToSend.length()+1];
    msgToSend.toCharArray(buf, msgToSend.length()+1);
    int msgid = coap.send(RpiIP, CoAPPort, "report-error", COAP_NONCON, COAP_GET, NULL, 0, (const uint8_t*)buf, msgToSend.length(), COAP_TEXT_PLAIN);
    
    /*Serial.println("FUNC NAME:");
    Serial.println(__FUNCTION__);//checkInValues
    Serial.println(__func__); //checkInValues
    Serial.println(__PRETTY_FUNCTION__); // void checkInValues()*/
}





//netsh interface ip show joins
