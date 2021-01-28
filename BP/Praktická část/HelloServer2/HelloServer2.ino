#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>


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
int stmivat = 0;
int count = 0;
int pwm = 10;
float desetina = 0.1;
String i1 = "\
<!DOCTYPE HTML><html><head>\
  <title>Automatizace</title>\
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\
  </head>\
  <style>\
p {padding:5px;}\
  </style>\
  <body>\
    LED1:(";

    
String i_on = ")<a href=\"vypnout\">Vypnout</a><br>";
String i_off = ")<a href=\"zapnout\">Zapnout</a><br>";
String i_pwm = ")<a href=\"zapnout\">Zapnout</a><a href=\"vypnout\">Vypnout</a><br>";

void handleRoot() {  
 //String s = MAIN_page; //Read HTML contents
 server.send(200, "text/html", i1+ sviti+i_off + "</body></html>"); //Send web page
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

  server.on("/zapnout", []() {
    stmivat = 0;
    digitalWrite(led, 1);
    sviti = 1;
    server.send(200, "text/html", i1+ sviti+i_on + "</body></html>"); //Send web page
  });
  server.on("/vypnout", []() {
    stmivat = 0;
    digitalWrite(led, 0);
    sviti = 0;
    server.send(200, "text/html", i1+ sviti+i_off + "</body></html>"); //Send web page
  });

  server.on("/pwm", []() {
    stmivat = 1;
    server.send(200, "text/html", i1+ sviti+i_pwm + "</body></html>"); //Send web page
  });
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

void loop(void) {
  server.handleClient();
  MDNS.update();
  /*if(stmivat==1){
    if((count*10)<(pwm*desetina)){
      sviti = 0;
      digitalWrite(led, 0);
    }else{      
      sviti = 1;
      digitalWrite(led, 1);
    }
    count++;
    if(count > 2*pwm){
      count = 0;
    }
    delay(1);
  }*/
}
