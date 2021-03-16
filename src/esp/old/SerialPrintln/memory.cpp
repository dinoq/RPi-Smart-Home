
#include <EEPROM.h>
#include "memory.h"

Memory::Memory(){
  EEPROM.begin(512);   
  readAddr = 0;
  writeAddr = 0;
}

float Memory::readFloat() {         
    float val = Memory::readFloat(readAddr);
    readAddr += 4;
    return val;
}      

float Memory::readFloat(short address) {
        char bytes[] = {EEPROM.read(address), EEPROM.read(address+1), EEPROM.read(address+2), EEPROM.read(address+3)};
        float val;
        memcpy(&val, &bytes, sizeof(val));
        return val;
}      

void Memory::writeFloat(float val){   
    Memory::writeFloat(writeAddr, val);
    writeAddr += 4;
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
