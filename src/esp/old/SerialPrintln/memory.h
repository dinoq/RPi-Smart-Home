
#ifndef __MEMORY_H__
#define __MEMORY_H__

class Memory{
  public:  
    Memory();
    short readAddr;   
    short writeAddr;      
    float readFloat();
    float readFloat(short address);
    void writeFloat(float val);
    void writeFloat(char address, float val);
    /*void writeSensorInfo(float val);
    void writeSensorInfo(char address, float val);*/

};
#endif
