
//#include "esp.h"
#include "memory.h"

Memory::Memory(){
  EEPROM.begin(512);   
  addr = 0;
}

void Memory::clear(short fromAddr, short toAddr){
    for(int i = fromAddr; i < toAddr; i++){
        EEPROM.write(i, 0);
    }
    EEPROM.commit();
}

void Memory::commit(){
    EEPROM.commit();
}

//Float operations
float Memory::readFloat() {         
    float val = readFloat(addr);
    addr += 4;
    return val;
}      

float Memory::readFloat(short address) {
        char bytes[] = {EEPROM.read(address), EEPROM.read(address+1), EEPROM.read(address+2), EEPROM.read(address+3)};
        float val;
        memcpy(&val, &bytes, sizeof(val));
        return val;
}      

void Memory::writeFloat(float val){   
    writeFloat(addr, val);
    addr += 4;
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
    char val = readByte(addr);
    addr++;
    return val;
}      

char Memory::readByte(short address) {
        return EEPROM.read(address);
}      

void Memory::writeByte(char val){   
    writeByte(addr, val);
    addr++;
}      


void Memory::writeByte(short address, char val){         
        EEPROM.write(address, val);
}      



void Memory::writeString(char *str, char len){   
    writeString(addr, str, len);
    addr += len;
}      


void Memory::writeString(short address, char *str, char len){ 
    for(int i = 0; i < len; i++){
        writeByte(address+i, str[i]);
    }
    EEPROM.commit();
}   

char Memory::writeString2(short address, char *str, char len){ 
    return len;
}   
