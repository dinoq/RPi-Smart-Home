#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

#include "index.h" //Our HTML webpage contents with javascripts

#ifndef STASSID
#define STASSID "huawei"
#define STAPSK  "hotspot1"
#endif

const char* ssid = STASSID;
const char* password = STAPSK;
String ip = "192.168.43.160";
ESP8266WebServer server(80);

const int led = 14;
int sviti = 0;

void handleRoot() {
  
 String s = MAIN_page; //Read HTML contents
 server.send(200, "text/html", s); //Send web page
 /*
  String m;
  if(sviti == 0){    
    digitalWrite(led, 1);
    sviti = 1;
    m = "<html>\
    Zapnuto...<br><h1><a href=\"http://" + ip + "\">Vypnout</a></h1>";
  }else{    
    digitalWrite(led, 0);
    sviti = 0;
    m = "Vypnutoo...<br><h1><a href=\"http://" + ip + "\">Zapnout</a></h1>";
  }
  
  server.send(200, "text/html", m);*/
}

void handleNotFound() {
  digitalWrite(led, 1);
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
  digitalWrite(led, 0);
}

void setup(void) {
  pinMode(led, OUTPUT);
  digitalWrite(led, 0);
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin("esp8266")) {
    Serial.println("MDNS responder started");
  }

  server.on("/", handleRoot);

  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

void loop(void) {
  server.handleClient();
  MDNS.update();
}
