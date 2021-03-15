
#include <EEPROM.h>
#include "memory.h"

float Memory::readFloat() {         
    Memory::readFloat(readAddr);
    readAddr = 4;
}      

float Memory::readFloat(short address) {   
        char bytes[] = {EEPROM.read(address), EEPROM.read(address+1), EEPROM.read(address+2), EEPROM.read(address+3)};
        float val;
        memcpy(&val, &bytes, sizeof(val));
        return val;
}      

void Memory::writeFloat(float val){   
  EEPROM.begin(512);     
    Memory::writeFloat(Memory::writeAddr, val);
    Memory::writeAddr += 4;
}      


void Memory::writeFloat(char address, float val){ 
        char *bytes;
        bytes = (char*) & val;
        
        EEPROM.write(address++, bytes[0]);
        EEPROM.write(address++, bytes[1]);
        EEPROM.write(address++, bytes[2]);
        EEPROM.write(address++, bytes[3]);
        EEPROM.commit();
}      

short Memory::writeAddr = 0;
short Memory::readAddr = 0;
