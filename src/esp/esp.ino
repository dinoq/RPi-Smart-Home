#include <coap-simple.h>
#include <WiFiUdp.h>
#include <ESP8266WiFi.h>

#ifndef APSSID
#define APSSID "sprintel_antlova"
#define APPSK  "netis111"
#endif

/* Set these to your desired credentials. */
const char *ssid = APSSID;
const char *password = APPSK;

IPAddress local_IP(192,168,10,10);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,255,0);

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
  Serial.println();

  if (message.equals("0"))
    LEDSTATE = false;
  else if(message.equals("1"))
    LEDSTATE = true;
      
  if (LEDSTATE) {
    digitalWrite(LED_BUILTIN, HIGH) ; 
    coap.sendResponse(ip, port, packet.messageid, "1");
  } else { 
    digitalWrite(LED_BUILTIN, LOW) ; 
    coap.sendResponse(ip, port, packet.messageid, "0");
  }
}

void callback_light2(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Light] ON/OFF22");
}
void callback_light3(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Light] ON/OFF33");
}
void callback_light4(CoapPacket &packet, IPAddress ip, int port) {
  Serial.println("[Light] ON/OFF44");
}
void setup() {
  //delay(1000);
  Serial.begin(115200);

  randomSeed(micros());
  
  
//   Serial.println(WiFi.softAPConfig(local_IP, gateway, subnet) ? "Ready" : "Failed!");
//   Serial.println(WiFi.softAP(ssid/*+String(random(1000))*/, password) ? "Ready" : "Failed!");
//   Serial.print("Soft-AP IP address = ");
//   Serial.println(WiFi.softAPIP());

  
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
  coap.server(callback_light, "light");
  //coap.server(callback_light2, "light");
  //coap.server(callback_light3, "light");
  //coap.server(callback_light4, "");
  
  client_count = 0;
  //wifiServer.begin();
  
  coap.start();
}

void loop() {
    
  delay(1000);
  coap.loop();
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
