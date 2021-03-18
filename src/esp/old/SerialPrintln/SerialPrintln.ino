
#include "SerialPrintln.h"
#include "memory.h"


Memory mem;
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

  byte typ = ANALOG;
  int typ2 = ANALOG;
  byte typ3 = DIGITAL;
  Serial.println("sizeof(IO_TYPES)");
  Serial.println(sizeof(IO_TYPES));
  Serial.println(sizeof(ANALOG));
  Serial.println(sizeof(DIGITAL));
  Serial.println(sizeof(typ));
  Serial.println(sizeof(typ2));
  Serial.println(sizeof(typ3));
  Serial.println(sizeof((byte)DIGITAL));


  
  Serial.println("values from shifted_enum");
  Serial.println(ITEM0);
  Serial.println(ITEM1);
  Serial.println(ITEM2);
  Serial.println(ITEM3);
  Serial.println(ITEM4);
  
  Serial.println("val declaration");
  float val;
  Serial.println(val);
  
  Serial.println("memcmp a strncmp");
  char input2[] = "1teplota";
  char buffer2[] = "teplota";
  int n;
  Serial.println(memcmp( input2+1, buffer2, sizeof(buffer2)));
  Serial.println(memcmp( input2, buffer2, sizeof(buffer2) ));
  Serial.println(strncmp( input2+1, buffer2, sizeof(buffer2) ));
  Serial.println(strncmp( input2, buffer2, sizeof(buffer2) ));
  Serial.println("dynamic strncmp");
  Serial.println(strncmp( input2+1, "teplota", strlen("teplota")));
  Serial.println(strncmp( input2+1, "teploty", strlen("teploty")));
  Serial.println(strncmp( input2+1, "teplot", strlen("teplot")));
  
  Serial.println("bool");
  Serial.println(1);
  Serial.println(0);
  Serial.println(100);
  Serial.println((bool)1);
  Serial.println((bool)0);
  Serial.println((bool)100);
  Serial.println(!1);
  Serial.println(!0);
  Serial.println(!100);
  Serial.println(!(bool)1);
  Serial.println(!(bool)0);
  Serial.println(!(bool)100);

  Serial.println("atoi");
  char pinStr[3];
  char input3[]="A12";
  Serial.println(strlen(input)-1);
  Serial.println((byte)atoi(strncpy(pinStr, input3+1, strlen(input3)-1)));


  /*
  Serial.println("EEPROM put");
  EEPROM.put(0, 97);
  EEPROM.put(1, 1.1);
  Serial.println(EEPROM.read(0));
  Serial.println(EEPROM.read(1));
  Serial.println(EEPROM.read(2));
  Serial.println(EEPROM.read(3));
  Serial.println(EEPROM.read(4));
  Serial.println(EEPROM.read(5)); */
  
  Serial.println("EEPROM custom class");
  /*int address = 0;
  float vall = 1.1;
        char *bytes;
        bytes = (char*) & vall;
        
  EEPROM.begin(512);  
  Serial.println((int)bytes[0]);
  Serial.println((int)bytes[1]);
  Serial.println((int)bytes[2]);
  Serial.println((int)bytes[3]);
        EEPROM.write(address++, bytes[0]);
        EEPROM.write(address++, bytes[1]);
        EEPROM.write(address++, bytes[2]);
        EEPROM.write(address++, bytes[3]);
        EEPROM.commit();
  int ch = (int)EEPROM.read(0);
  Serial.println(ch);
  Serial.println(char (ch));*/
  mem.writeFloat(33.3);
  /*Serial.println(Memory::readAddr);
  Memory::writeFloat(4.3);
  Serial.println(Memory::readFloat());
  Serial.println(Memory::readAddr);
  Serial.println(Memory::readFloat());
  Serial.println(Memory::readAddr);*/
  Serial.println("first 10 bytes:");
  for(int i = 0; i < 10; i++){
    Serial.println((int)EEPROM.read(i));
    EEPROM.write(i, 0); //clear it for next run
  }
  EEPROM.commit();

  float newVal = 1.2345;
  char sprintfpokus[15];
  sprintf(sprintfpokus, "in:%.1f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.0f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.3f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.4f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.5f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.8f", newVal);
  Serial.println(sprintfpokus);
  sprintf(sprintfpokus, "in:%.10f", newVal);

  byte IN = 100; // ITEM0
  byte bArr[] = {ITEM0, ITEM1, ITEM2};
  if(valueIsIn(IN, bArr)){
    Serial.println("IS in");
  }else{
    Serial.println("NOT in");
  }
  
  byte IN2 = 121; // ITEM3
  if(valueIsIn(IN2, bArr)){
    Serial.println("IS in");
  }else{
    Serial.println("NOT in");
  }

  Serial.println("sizeof");
  char s[3];
  s[0]='A';
  s[1]='B';
  s[2]='C';
  Serial.println(((int)s[1]));
  Serial.println(((int)s[2]));
  Serial.println(((int)s[3]));
  Serial.println(sizeof(s));
  Serial.println(strlen(s));
}

void loop() {
  delay(1000);
}

bool valueIsIn(byte val, byte arr[])
{
    for(int i = 0; i < (sizeof(arr) / sizeof(arr[0])); i++)
    {
        if(arr[i] == val)
            return true;
    }
    return false;
}


SensorInfo getSensorInfo(char input[]){
  SensorInfo i;
  return i;
}
