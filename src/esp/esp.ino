#include "esp.h"

WiFiUDP Udp;
IPAddress multicastIP(224, 0, 1, 180);//187
IPAddress RpiIP;
String moduleID;
char incomingPacket[255]; // buffer for incoming packets

Coap coap(Udp);
unsigned int CoAPPort = 5683;

/**
 * Others variables
 * */
String inputPrefix = "input=";
int inputPrefixLen = 6;
int lastConnectedToRPi = 0; // Number of seconds from last connection
bool BMP280Begun = false;
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
    delay(200); // Sleep little bit after reset to wait for Serial init...

    resetFromMemory();
    Serial.println("Memory after resetFromMemory()");
    printMemory("Memory on init");

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
    coap.server(callbackSetOutput, "set-output");
    coap.server(callbackObserveInput, "observe-input");
    coap.server(callbackStopInputObservation, "stop-input-observation");
    coap.server(callbackChangeObservedInput, "change-observed-input");
    coap.server(callbackResetModule, "reset-module");
    coap.server(callbackHelloClient, "hello-client");
    coap.server(callbackSetId, "set-id");

    coap.response(callbackResponse);

    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort); // In order to enable listening on multicast
    Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), CoAPPort);

    coap.start();

    //resetModule();
}

// Loop function
void loop()
{
    delay(SENSOR_CHECK_TIME);
    //checkRPiConn();
    //checkMulticast();
    coap.loop();
    checkInValues();
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

    char replyPacket[40]; // a reply string to send back

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
            //Serial.printf("UDP packet contents: |%s|\n", incomingPacket);

            String helloClientMsg = "HELLO-CLIENT";
            String getIDMsg = "GET-ID";
            bool reply = false;
            if (String(incomingPacket).equals(helloClientMsg) && !RpiIP.isSet())
            {
                ("TYPE:" + boardType).toCharArray(replyPacket, sizeof(replyPacket));
                reply = true;
            }
            else if (lastConnectedToRPi >= withoutConnTimeLimit && moduleID.length() > 0) // Case, when IP address was changed (either of Raspberry Pi or of module). Module send back its ID to update IP in database in case of change
            {
                ("reply-ID:" + moduleID).toCharArray(replyPacket, sizeof(replyPacket));
                reply = true;
            }
            else if (RpiIP.isSet())
            { // don't send anything back, but also don't fall into else (error)
            }
            else
            {
                Serial.println("-CHYBA: Neznámá zpráva v příchozím UDP paketu ve funkci checkMulticast()!");
            }
            if(reply){
              Serial.println("replyPacket:" + String(replyPacket));
              Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
              Udp.write(replyPacket);
              Udp.endPacket();
            }
        }
    }
}

int run = 10000;
void checkInValues()
{
    if (!RpiIP.isSet())
    {
        return;
    }
    if (run > 0 || true)

        for (int i = 0; i < WATCHED_IN_LIMIT; i++)
        {
            if (watched[i].IN != UNSET)
            {
                initIfBMP280AndNotInited(watched[i].IN); //If sensor was not connected until now, init communication with it
                float newVal = getSensorVal(watched[i]);
                if (watched[i].IN == BMP280_TEMP || watched[i].IN == BMP280_PRESS)
                { // If sensor is BMP280 and received value is 0.00, there is chance, that sensor was removed (and maybe connected again), so initialize and if succed get value again...
                    if (!bmp.begin(BMP280_ADRESS))
                    {
                        Serial.println("BMP280 senzor nenalezen");
                    }
                    else
                    {
                        newVal = getSensorVal(watched[i]);
                    }
                }
                /*Serial.println("watched[i].IN");
            Serial.println((byte)watched[i].IN);
            Serial.println("val, newval: "+String(watched[i].val)+"," + String(newVal));*/
                if (isDifferentEnough(newVal, watched[i].val, watched[i].IN))
                {
                    Serial.println("watched[i].IN a val");
                    Serial.println((byte)watched[i].IN);
                    Serial.println(watched[i].val);

                    char payload[15];
                    if (watched[i].IN >= BMP280_TEMP && watched[i].IN <= SHT21_HUM)
                    {                                                                                      // sprintf %.1f in order to display only 1 digit after decimal point for specified inputs
                        sprintf(payload, "in:%.1f%c%c", newVal, watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                    }
                    else
                    {
                        sprintf(payload, "in:%f%c%c", newVal, watched[i].val_type, (watched[i].IN + 1)); // Add 1 to IN, because we use strlen(payload) later and we don't want to consider GPIO0 (=>0) as null terminator. We mus substract that 1 on receiving server...
                    }
                    /*payload[strlen(payload)] = watched[i].val_type;
                Serial.println(strlen(payload));
                payload[strlen(payload)] = watched[i].IN;
                Serial.println(strlen(payload));
                payload[strlen(payload)] = 0;
                Serial.println(strlen(payload));*/
                    int msgid = coap.send(RpiIP, CoAPPort, "new-value", COAP_NONCON, COAP_PUT, NULL, 0, (uint8_t *)&payload, strlen(payload), COAP_TEXT_PLAIN);
                    /*Serial.println("msgid:");
                Serial.println(msgid);
                Serial.print("newVal: |");
                Serial.println(newVal);*/
                    watched[i].val = newVal;
                    run--;
                }
            }
        }
}

void initIfBMP280AndNotInited(byte IN)
{
    if ((IN == BMP280_TEMP || IN == BMP280_PRESS))
    { // If BMP280, init...
        if (!BMP280Begun)
        {
            if (!bmp.begin(BMP280_ADRESS))
            {
                Serial.println("BMP280 senzor nenalezen");
            }
            else
            {
                Serial.println("BMP280 inited");
                BMP280Begun = true;
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
 * Function reads and returns sensor value (specified by IN)
 */
float getI2CVal(byte IN)
{
    float val = INVALID_SENSOR_VALUE;
    val = (IN == BMP280_TEMP) ? bmp.readTemperature() : val;
    val = (IN == BMP280_PRESS) ? bmp.readPressure() : val;
    val = (IN == SHT21_TEMP) ? SHT2x.GetTemperature() : val;
    val = (IN == SHT21_HUM) ? SHT2x.GetHumidity() : val;

    if (val == INVALID_SENSOR_VALUE)
    {
        Serial.println("-CHYBA: Neznámý vstup sběrnice I2C ve funkci getI2CVal(byte IN). Přidejte konstatu do výčtu IN_TYPE a upravte funkci!");
    }

    return val;
}

/**
 * Function determine and returns if new value is different enough from old value to send it to server (we don't want to send to server for example when temperature changes by 0.001 °C)
 */
bool isDifferentEnough(float newVal, float oldVal, byte IN)
{
    float diff = fabs(oldVal - newVal);
    byte oneDecimalPoint[] = {BMP280_TEMP, SHT21_TEMP, SHT21_HUM};
    byte noDecimal[] = {BMP280_PRESS};

    if (valueIsIn(IN, oneDecimalPoint))
    {
        return (diff >= 0.1);
    }
    else if (valueIsIn(IN, noDecimal))
    {
        return (diff >= 1);
    }
    else if (IN >= 0 && IN < BMP280_TEMP)
    {
        return (diff >= 5); // For pins consider 5 as enough difference
    }
    else
    {
        Serial.printf("-CHYBA: Neznámá hodnota (%i) ve funkci isDifferentEnough(). Přidejte konstantu do výčtu IN_TYPE a upravte funkci.", IN);
    }

    return false;
}

/**
 * Function check if array arr contains value val
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

// CoAP client response callback
void callbackResponse(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("[Coap Response got]");

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    Serial.println(p);
}

/** 
 * Called when Raspberry Pi server is looking for new module. 
 * It can't save Raspberry Pi IP address. It is saved after Server accept response and send module new ID. 
 * So IP is saved in function callbackSetId()
 */
void callbackHelloClient(CoapPacket &packet, IPAddress ip, int port)
{
    if (RpiIP.isSet())
        return;

    Serial.println("callbackHelloClient");
    Serial.println(RpiIP.toString());
    Serial.println(RpiIP.isSet());
    lastConnectedToRPi = 0;

    char replyPacket[40]; // a reply string to send back
    ("TYPE:" + boardType).toCharArray(replyPacket, sizeof(replyPacket));
    coap.sendResponse(ip, port, packet.messageid, replyPacket, strlen(replyPacket), COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

/**
 * Called when server choosed module as new module and send to it its new ID. Now module can save server IP.
 */
void callbackSetId(CoapPacket &packet, IPAddress ip, int port)
{
    if (moduleID.length() > 0 || RpiIP.isSet())
        return;

    Serial.println("callbackSetId");

    setRPiIP(ip);

    lastConnectedToRPi = 0;

    char p[packet.payloadlen + 1];
    memcpy(p, packet.payload, packet.payloadlen);
    p[packet.payloadlen] = NULL;

    setModuleID(p, packet.payloadlen + 1);

    mem.setAllSensorsInfos(SENSOR_INFO_MEM_ADDR, WATCHED_IN_LIMIT, UNSET, UNSET); // Clear Sensors Infos part of memory

    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
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
    { // packet.payloadlen + 1 bacause of NULL terminator
        mem.writeByte(ID[i]);
    }
    mem.commit();

    moduleID = String(ID);
    Serial.println("Nastavené ID: " + moduleID);

    printMemory("mem po nastaveni module ID:");
}

// CoAP server endpoint URL for complet reset of module
void callbackResetModule(CoapPacket &packet, IPAddress ip, int port)
{
    Serial.println("callbackResetModule");
    if (!RpiIP.isSet())
        return;
    resetModule(); // Parameters are not need when reseting module
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

void resetModule()
{

    Serial.println("resetModule");

    // Clear memory
    mem.clear(0, USED_MEM_END);

    lastConnectedToRPi = withoutConnTimeLimit; // We know here, that there will be no connection from Raspberry Pi
    RpiIP = IPAddress();
    moduleID = "";

    //Also reset all sensors info...
    for (int i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        watched[i].IN = UNSET;
        watched[i].val_type = UNSET;
        watched[i].val = UNINITIALIZED_SENSOR_VALUE;
    }
}

// CoAP server endpoint URL
void callbackSetOutput(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
        return;
        
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
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
    
    return;
}

// CoAP server endpoint URL
void callbackObserveInput(CoapPacket &packet, IPAddress ip, int port)
{
    if (!RpiIP.isSet())
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
    if (!alreadyWatched(info))
    {
        Serial.println("unikátni listen");
        mem.writeByte(SENSOR_INFO_DATA_MEM_ADDR + watchedINIndex * 2, info.IN);
        mem.writeByte(SENSOR_INFO_DATA_MEM_ADDR + watchedINIndex * 2 + 1, info.val_type);
        mem.commit();
        watched[watchedINIndex++] = info;
        printMemory("Memory after listen cbf");
        initIfBMP280AndNotInited(info.IN);
        if(info.val_type == DIGITAL){
            pinMode(info.IN, INPUT);
        }

        Serial.println("watched");
        Serial.println(watchedINIndex - 1);
        Serial.println(watched[watchedINIndex - 1].IN);
        Serial.println(watched[watchedINIndex - 1].val);
        Serial.println(watched[watchedINIndex - 1].val_type);
    }

    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
    return;
}

// CoAP server endpoint URL
void callbackStopInputObservation(CoapPacket &packet, IPAddress ip, int port){
  
    if (!RpiIP.isSet())
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
            for(int j = i; j < (WATCHED_IN_LIMIT-1);j++){ //remove old watched IN from watched array
              watched[j].IN = watched[j+1].IN;
              watched[j].val_type = watched[j+1].val_type;
              watched[j].val = watched[j+1].val;              
            }

            //reset also last watched for case, that removed watched is at last pos
            watched[WATCHED_IN_LIMIT-1].IN = UNSET;
            watched[WATCHED_IN_LIMIT-1].val_type = UNSET;
            watched[WATCHED_IN_LIMIT-1].val = UNINITIALIZED_SENSOR_VALUE;       
        }
    }
    
    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
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
        else
        {
            Serial.println("-CHYBA: Neznámý vstup sběrnice I2C ve funkci getSensorInfo(char input[]). Přidejte konstatu do výčtu IN_TYPE a upravte funkci!");
        }
        /*Serial.print("getSensorInfoInput::");
        Serial.println(input);
        Serial.println(strlen("BMP280"));
        Serial.println(String(!strncmp(input + 4, "BMP280", strlen("BMP280"))));*/

        info.IN = IN;
        info.val_type = (byte)I2C;
        info.val = getI2CVal(IN);
    }
    else
    {
        Serial.println("-Chyba: neznámý vstup ve funkci getSensorInfo(char input[])! Možné hodnoty jsou A/D/I2C. Případně přidejte nové.");
    }

    return info;
}

bool alreadyWatched(SensorInfo sInfo)
{
    for (int i = 0; i < watchedINIndex /*WATCHED_IN_LIMIT*/; i++)
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
    if (!RpiIP.isSet())
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

    //TODO

    coap.sendResponse(ip, port, packet.messageid, NULL, 0, COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
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

    bool inMemory = true;
    //Is "SInfo:" in memory?
    for (i = 0; i < sizeof(prefixSInfo) - 1; i++)
    {
        byte b = mem.readByte();
        if (b != prefixSInfo[i])
        {
            Serial.println("SInfo in memory! fails at: " + String(i) + ", is:" + String(b) + "(at addr: " + String((byte)(mem.addr - 1)) + "), should be" + String(prefixSInfo[i]));
            inMemory = false;
            break;
        }
    }

    for (i = 0; i < WATCHED_IN_LIMIT; i++)
    {
        if (inMemory)
        {
            watched[i].IN = mem.readByte();
            watched[i].val_type = mem.readByte();
            initIfBMP280AndNotInited(watched[i].IN);
            watched[i].val = getSensorVal(watched[i].val_type, watched[i].IN);
            if (watched[i].IN != UNSET)
                watchedINIndex++;
        }
        else
        {
            watched[i].IN = UNSET;
            watched[i].val_type = UNSET;
            watched[i].val = UNINITIALIZED_SENSOR_VALUE;
        }
        //Serial.println(String(i)+", "+String(WATCHED_IN_LIMIT)+", "+String(mem.addr));
    }

    //if SInfo is not in memory (thus mem.addr was not changed to ID position), set it to ID position...
    if (!inMemory)
    {
        Serial.println("SInfo: NOT in memory");
        mem.addr = ID_MEM_ADDR;
    }
    else
    {
        Serial.println("SInfo: in memory");
    }

    if (ipInMemory) // If IP is not in memory, ID is also not there...
    {
        inMemory = true;
        //Is "ID:" in memory?
        for (i = 0; i < sizeof(prefixID) - 1; i++)
        {
            byte b = mem.readByte();
            if (b != prefixID[i])
            {
                Serial.println("moduleID in memory! fails at: " + String(i) + ", is:" + String(b) + "(at addr: " + String((byte)(mem.addr - 1)) + "), should be" + String(prefixID[i]));
                inMemory = false;
                break;
            }
        }
        if (inMemory) // If "ID:" had been found in memory, get ID, which follows
        {
            Serial.println("moduleID in memory!");
            char ch;
            while ((ch = mem.readByte()) != 0)
            {
                moduleID += ch;
            }
            moduleID += (char)0;
        }
    }
    if (!ipInMemory || !inMemory) // If ip or ID is not in memory, clear it!
    {
        moduleID = "";
        Serial.println("moduleID NOT in memory!");
    }
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

//netsh interface ip show joins
