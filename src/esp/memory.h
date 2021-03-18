
#ifndef __MEMORY_H__
#define __MEMORY_H__

#include <EEPROM.h>


class Memory{
  public:  
    Memory();
    short addr;   
    
    void clear(short from, short to);
    void setAllSensorsInfos(short from, char count, char IN, char val_type);
    void commit();    
    
    float readFloat();
    float readFloat(short address);
    void writeFloat(float val);
    void writeFloat(short address, float val);
    
    char readByte();
    char readByte(short address);
    void writeByte(char val);
    void writeByte(short address, char val);

    
    void writeString(char str[]);
    void writeString(short address, char str[]);
    /*void writeSensorInfo(float val);
    void writeSensorInfo(char address, float val);*/

};

#endif
