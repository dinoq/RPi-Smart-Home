

void setup() {
  // initialize digital pin LED_BUILTIN as an output.
    //delay(1000);
    Serial.begin(115200);
    Serial.println();
    delay(1000); // Sleep little bit after reset to wait for Serial init...

    Serial.println();
    Serial.println("ASD");
    Serial.println("ASD");
    Serial.println("ASD");
    Serial.println("ASD");
  //pinMode(0, OUTPUT);
  pinMode(1, OUTPUT);
  //pinMode(2, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(1, HIGH);   // turn the LED on (HIGH is the voltage level)
  //digitalWrite(2, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(100);                       // wait for a second
  digitalWrite(1, LOW);    // turn the LED off by making the voltage LOW
  //digitalWrite(2, LOW);    // turn the LED off by making the voltage LOW
  delay(200);                       // wait for a second
}