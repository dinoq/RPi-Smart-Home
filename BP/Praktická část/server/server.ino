#include "ESP8266WiFi.h"
 
const char* ssid = "sprintel_antlova";
const char* password =  "netis111";
 
WiFiServer wifiServer(60000);

byte message_buffer[100];
int data_index;
int client_count;

byte led = 14;
byte led2 = 3;

void setup() {
  pinMode(led, OUTPUT);
  pinMode(4, OUTPUT);
  //analogWrite(led2, 500);
 
  Serial.begin(115200);
 
  delay(1000);
 
  WiFi.begin(ssid, password);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting..");
  }
 
  Serial.print("Connected to WiFi. IP:");
  Serial.println(WiFi.localIP());
 
  wifiServer.begin();
  client_count = 0;
}

void loop() {
  /*
 digitalWrite(led2, HIGH);   // turn the LED on (HIGH is the voltage level)
 digitalWrite(3, HIGH);   // turn the LED on (HIGH is the voltage level)
 digitalWrite(4, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(1000);                       // wait for a second
  digitalWrite(led2, LOW);           // wait for a second
 digitalWrite(3, LOW);   // turn the LED on (HIGH is the voltage level)
 digitalWrite(4, LOW);   // turn the LED on (HIGH is the voltage level)
  delay(1000); */

  
  WiFiClient client = wifiServer.available();
  int stop = 0;
  if (client) {
    clear_message_buffer();
    Serial.println("client connected");
    while (client.connected()) {
    //Serial.println("client STILL connected");

 
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
    analogWrite(4, val);
    
    /*
    Serial.println("\nPřijatá data:");
    Serial.write(message_buffer,sizeof(message_buffer));
    Serial.println("\nčitelná data:");
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
    Serial.println();*/
    Serial.println((String)"Client " + client_count++ + " disconnected");
 
  }
}

void clear_message_buffer(){
  for(int i = 0; i < sizeof(message_buffer); i++){
    message_buffer[i] = 0;
  }
  data_index = 0;
  
}
