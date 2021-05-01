/*
Zatím ovládání serva
může se hodit pro rozeznání prvního spuštění (pro nahrátí údajům k wifi či IP adr RPi: http://www.nihamkin.com/how-to-detect-first-boot-after-burning-program-to-flash.html
*/
#define PIN 9      // control pin
#define DELAY 10    // 20ms internal delay; increase for slower fades
// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(9, OUTPUT);
  
  pinMode(PIN, OUTPUT);
}
int a = 0;
// the loop function runs over and over again forever
void loop() {
  // fade in
  /*
    digitalWrite(PIN, HIGH);
    delay(DELAY);
    digitalWrite(PIN, LOW);
    delay(DELAY);*/

    for(int i=0; i<255; i++) {
    analogWrite(PIN, i);
    delay(DELAY);
  }

  // fade out
  for(int i=0; i<255; i++) {
    analogWrite(PIN, 255-i);
    delay(DELAY);
  }
}
