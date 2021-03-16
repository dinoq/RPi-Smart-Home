
#ifndef __MEMORY_H__
#define __MEMORY_H__

class Memory{
  public:  
    Memory();
    short readAddr;   
    short writeAddr;  
    
    void clear(short from, short to);
    void setAllSensorsInfos(short from, char count, char IN, char val_type, float value);
    void commit();    
    
    float readFloat();
    float readFloat(short address);
    void writeFloat(float val);
    void writeFloat(short address, float val);
    
    char readByte();
    char readByte(short address);
    void writeByte(char val);
    void writeByte(short address, char val);
    /*void writeSensorInfo(float val);
    void writeSensorInfo(char address, float val);*/

};

#endif
