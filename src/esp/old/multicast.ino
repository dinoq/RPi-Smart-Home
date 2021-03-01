#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

const char* ssid = "sprintel_antlova";
const char* password = "netis111";

WiFiUDP Udp;
unsigned int multicastPort = 1900;  // local port to listen on
//IPAddress multicastIP(239,255,255,250);//funkcni
IPAddress multicastIP(224,98,0,251);
//IPAddress multicastIP(239, 0, 0, 57);

char incomingPacket[255];  // buffer for incoming packets
char  replyPacket[] = "Hi there! Got the message :-)";  // a reply string to send back

void setup(){
    Serial.begin(115200);
    Serial.println();
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);  

    Serial.printf("Connecting to %s ", ssid);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
    delay(500);
    Serial.print(".");
    }
    Serial.println("connected");

    Serial.println("beginMulticast");
    Serial.println(Udp.beginMulticast(WiFi.localIP(), multicastIP, multicastPort));
    Serial.printf("Now listening at IP %s and %s, UDP port %d\n", WiFi.localIP().toString().c_str(), multicastIP.toString().c_str(), multicastPort);
}


void loop(){
    int packetSize = Udp.parsePacket();
    if (packetSize){
        Serial.println("RECEIVED!");
        for(int i = 0; i<5; i++){        
            digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
            delay(100);                       // wait for a second
            digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
            delay(100);                       // wait for a second
        }
        
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
    }
}