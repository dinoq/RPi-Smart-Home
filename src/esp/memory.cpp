
#include <EEPROM.h>
#include "memory.h"

Memory::Memory(){
  EEPROM.begin(512);   
  readAddr = 0;
  writeAddr = 0;
}

void Memory::clear(short fromAddr, short toAddr){
    for(int i = fromAddr; i < toAddr; i++){
        EEPROM.write(i, 0);
    }
    EEPROM.commit();
}

void Memory::setAllSensorsInfos(short fromAddr, char count, char IN, char val_type, float value){
    for(int i = 0; i < count; i++){
        writeByte(fromAddr + 6*i, IN);
        writeByte(fromAddr + 6*i, val_type);
        writeFloat(fromAddr + 6*i, value);
    }
    EEPROM.commit();
}

void Memory::commit(){
    EEPROM.commit();
}

//Float operations
float Memory::readFloat() {         
    float val = readFloat(readAddr);
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


void Memory::writeFloat(short address, float val){ 
        char *bytes;
        bytes = (char*) & val;
        
        EEPROM.write(address++, bytes[0]);
        EEPROM.write(address++, bytes[1]);
        EEPROM.write(address++, bytes[2]);
        EEPROM.write(address++, bytes[3]);
}      

//Byte operations
char Memory::readByte() {         
    char val = Memory::readByte(readAddr);
    readAddr++;
    return val;
}      

char Memory::readByte(short address) {
        char bytes[] = {EEPROM.read(address), EEPROM.read(address+1), EEPROM.read(address+2), EEPROM.read(address+3)};
        float val;
        memcpy(&val, &bytes, sizeof(val));
        return val;
}      

void Memory::writeByte(char val){   
    Memory::writeByte(writeAddr, val);
    writeAddr++;
}      


void Memory::writeByte(short address, char val){ 
        char *bytes;
        bytes = (char*) & val;
        
        EEPROM.write(address++, bytes[0]);
        EEPROM.write(address++, bytes[1]);
        EEPROM.write(address++, bytes[2]);
        EEPROM.write(address++, bytes[3]);
}      
