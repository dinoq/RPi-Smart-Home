#include "coap-simple.h"
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>
#include "user_interface.h"


#ifndef APSSID
#define APSSID "sprintel_antlova"
#define APPSK  "netis111"
#endif

/* Set these to your desired credentials. */
const char *ssid = APSSID;
const char *password = APPSK;

IPAddress multicastIP(224,0,1,187);
IPAddress local_IP(192,168,10,10);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,255,0);

WiFiUDP Udp;
unsigned int localUdpPort = 4210;  // local port to listen on
unsigned int CoAPPort = 5683;
char incomingPacket[255];  // buffer for incoming packets
char  replyPacket[] = "Hi there! Got the message :-)";  // a reply string to send back

WiFiServer wifiServer(60000);

byte message_buffer[100];
int data_index;
int client_count;

// UDP and CoAP class
WiFiUDP udp;
Coap coap(udp);

// LED STATE
bool LEDSTATE;

// CoAP server endpoint URL
void callback_light(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Light] ON/OFF");
  
  // send response
  char p[packet.payloadlen + 1];
  memcpy(p, packet.payload, packet.payloadlen);
  p[packet.payloadlen] = NULL;
  
  String message(p);
  Serial.println("payload:::");
  Serial.println(message);
  Serial.println("tokenlen:");
  Serial.println(packet.tokenlen);
  Serial.println("pay len:");
  Serial.println(packet.payloadlen);
  Serial.println("pay len:");
  Serial.println(*(packet.options[0].buffer+1));
  Serial.write((packet.options[0].buffer),4);
  Serial.println();
  //Serial.write((packet.options[0].buffer),sizeof(packet.options[0].buffer));
  Serial.write((packet.options[0].buffer),packet.options[0].length);
  Serial.println();
  
  Serial.println("1:::");
  Serial.println(*(packet.options[1].buffer+1));
  Serial.println("AQ");
  Serial.write((packet.options[1].buffer),4);
  Serial.println("BU");
  //Serial.write((packet.options[1].buffer),sizeof(packet.options[1].buffer));
  Serial.write((packet.options[1].buffer),packet.options[1].length);
  Serial.println("TOKEN INFO:");
  Serial.println((*packet.token));
  Serial.write( (packet.token), packet.tokenlen);
  Serial.println("TOKEN INFO2:");
  Serial.println((*packet.token)-1);
  Serial.write( (packet.token)-1, packet.tokenlen);

  if (message.equals("0"))
    LEDSTATE = false;
  else if(message.equals("1"))
    LEDSTATE = true;
      
  if (LEDSTATE) {
    digitalWrite(LED_BUILTIN, HIGH) ; 
  } else { 
    digitalWrite(LED_BUILTIN, LOW) ; 
  }
  char *myArray;
  myArray = (char*) calloc (20,sizeof(char));
  myArray[0] = 'A';
  myArray[1] = 's';
  myArray[2] = 'E';
  myArray[3] = '\0';
  
  char str[] = "GfG"; /* Stored in stack segment */

  //coap.sendResponse(ip, port, packet.messageid, p,packet.payloadlen,COAP_CHANGED, COAP_APPLICATION_JSON, packet.token, packet.tokenlen);
  coap.sendResponse(ip, port, packet.messageid, str, sizeof(str),COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
  //delay(10000);
  //coap.sendResponse(ip, port, packet.messageid-1, NULL, 0,COAP_CHANGED, COAP_TEXT_PLAIN, packet.token, packet.tokenlen);
  //coap.sendResponse(ip, port, packet.messageid, p);
}

void get_IP(CoapPacket &packet, IPAddress ip, int port) {
    Serial.println("ip requested via multicast");
    String localIPStr = WiFi.localIP().toString();
    int ipLen = localIPStr.length() + 1;
    char localIP[ipLen];
    localIPStr.toCharArray(localIP, ipLen);
    coap.sendResponse(ip, port, packet.messageid, localIP, sizeof(localIP),COAP_CHANGED, COAP_TEXT_PLAIN, (packet.token), packet.tokenlen);
}

void setup() {
    //delay(1000);
    Serial.begin(115200);

    randomSeed(micros());

    /*
    WiFi.mode(WIFI_STA);
    // the below instructions and now u will receive.
    wifi_set_sleep_type(NONE_SLEEP_T); //LIGHT_SLEEP_T and MODE_SLEEP_T*/

    WiFi.begin(ssid, password);  
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    // LED State
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH);
    LEDSTATE = true;

    Serial.println("Setup Callback Light ver 4");
    coap.server(callback_light, "io");  
    coap.server(get_IP, "getip");  
    client_count = 0;
    //wifiServer.begin();


    Udp.beginMulticast(WiFi.localIP(), multicastIP, CoAPPort);
    Serial.printf("Now listening at IP %s IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(),multicastIP.toString().c_str(), CoAPPort);

    coap.start();
}

void loop() {
    
    delay(1000);
    int packetSize = Udp.parsePacket();
    if (packetSize)
    {
        // receive incoming UDP packets
        Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
    }
    coap.loop();

    /*int packetSize = Udp.parsePacket();
    if (packetSize)
    {
    // receive incoming UDP packets
    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
    int len = Udp.read(incomingPacket, 255);
    if (len > 0)
    {
        incomingPacket[len] = 0;
    }
    Serial.printf("UDP packet contents: %s\n", incomingPacket);

    // send back a reply, to the IP address and port we got the packet from
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(replyPacket);
    Udp.endPacket();
    }*/

    /*

    WiFiClient client = wifiServer.available();
    int stop = 0;
    if (client) {
    clear_message_buffer();
    Serial.println("client connecteeeed");
    while (client.connected()) { 
        while (client.available()==0) {
        if(!client.connected()){
            break;
        }
        }
        Serial.print("client.available()");
        Serial.print(client.available());
        Serial.println();
        while (client.available()>0) {
        char c = client.read();
        message_buffer[data_index++] = c;
        
            Serial.write(c);
        if(client.available() == 0){
            stop=1;          
            //Serial.write("\nkonec\n");
        }
        }
        if(stop == 1){
        //break;
        }
        delay(10);
    }

    client.stop();
    int val = message_buffer[0]*256 + message_buffer[1];
    Serial.println("\nPřijatá data:"); 
    Serial.print(val);
    val = message_buffer[2]*256 + message_buffer[3];
    Serial.println("\nPřijatá data2:"); 
    Serial.print(val);
    //analogWrite(4, val);


    Serial.println("\nPřijatá data w:");
    Serial.write(message_buffer,4);
    Serial.println("\n");
    Serial.println("Čitelná dataaaa:");
    Serial.print(message_buffer[0]);
    Serial.println();
    Serial.print(message_buffer[1]);
    Serial.println();
    Serial.print(message_buffer[2]);
    Serial.println();
    Serial.print(message_buffer[3]);
    Serial.println();
    Serial.println();
    Serial.print(message_buffer[0], BIN);
    Serial.println();
    Serial.print(message_buffer[1], BIN);
    Serial.println();
    Serial.print(message_buffer[2], BIN);
    Serial.println();
    Serial.print(message_buffer[3], BIN);
    //Serial.print(sizeof(message_buffer));
    Serial.println();
    Serial.println((String)"Client " + client_count++ + " disconnected");
    }*/
}

void clear_message_buffer(){
  for(int i = 0; i < sizeof(message_buffer); i++){
    message_buffer[i] = 0;
  }
  data_index = 0;
  
}

//netsh interface ip show joins
