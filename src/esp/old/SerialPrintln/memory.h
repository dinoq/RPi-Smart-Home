
#ifndef __MEMORY_H__
#define __MEMORY_H__

class Memory{
  public:  
    static short readAddr;   
    static short writeAddr;         
    static float readFloat();
    static float readFloat(short address);
    static void writeFloat(float val);
    static void writeFloat(char address, float val);

};
//short Memory::addr = 0;

#endif
