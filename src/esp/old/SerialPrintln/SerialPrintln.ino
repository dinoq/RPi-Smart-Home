

float watchedIO[20];

void setup() {
  // Open serial communications and wait for port to open:
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  String moduleID = "ABC";
  Serial.println("\n\nString  length():");
  Serial.println(("ID:"+moduleID).length());
  Serial.println(sizeof(watchedIO));
}

void loop() {
  delay(1000);
}
