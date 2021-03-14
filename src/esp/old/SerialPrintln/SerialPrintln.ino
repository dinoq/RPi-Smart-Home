

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


  /*unsigned long myTime;
  myTime = millis();*/
  int len;
  Serial.println(millis());
  char a[] = "ASDF";
  int max = 10; // change to 10000
  for(int i = 0; i < max; i++){
    a[0] = 'A';
    a[1] = 'S';
    a[2] = 'D';
    a[3] = 'F';
    a[4] = 0;
    len = strlen(a);
  }
  Serial.println(len);
  Serial.println(millis());
  String b = "ASDF";
  for(int i = 0; i < max; i++){
    b = String("ASDF");
    len = b.length();
  }
  Serial.println(len);
  Serial.println(millis());

  char str[12]="Hello W!";
  
  Serial.print("String length :");Serial.println(strlen(str));
  Serial.print("Array length :");Serial.println(sizeof(str));

  
  char payload[] = "AHOOJ";
  Serial.println(sizeof(payload));

  Serial.println();
  float RealNumber;
  byte  *ArrayOfFourBytes;
  RealNumber = 1.1;
  ArrayOfFourBytes = (byte*) & RealNumber;
  
  Serial.println(ArrayOfFourBytes[3]);
  Serial.println(ArrayOfFourBytes[2]);
  Serial.println(ArrayOfFourBytes[1]);
  Serial.println(ArrayOfFourBytes[0]);

  //byte bt[4]={63, 140,204,205};
  byte bt[4]={205,204,140,63};
  float newFloat;
  /*float newFloat=((bt[0] << 24) |
            (bt[1] << 16) |
            (bt[2] <<  8) |
             bt[3]);;*/
  memcpy(&newFloat, &bt, sizeof(newFloat));
  //&newFloat  = &bytes;
  Serial.println("newFloat");
  Serial.println(newFloat);
  
  float var_a = 9.99;
  int   var_b = (int)var_a;
  Serial.println("var_b");
  Serial.println(var_a);
  Serial.println(var_b);
  var_a = 1024.0;
  var_b = (int)var_a;
  Serial.println("var_b");
  Serial.println(var_a);
  Serial.println(var_b);

  
  Serial.println("strlen");
  char strl[] = "AHOOJ";
  Serial.println(strlen(strl));
  strl[0] = 0;
  Serial.println(strlen(strl));

  Serial.println("strncmp");
  char input[] = "I2Cc";
  bool i2c = strncmp(input, "I2C", 3); 
  Serial.println(i2c);
  input[1] = '3'; 
  i2c = strncmp(input, "I2C", 3); 
  Serial.println(i2c);
}

void loop() {
  delay(1000);
}
