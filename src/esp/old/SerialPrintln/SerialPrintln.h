
#include <EEPROM.h>

typedef struct SInfo SensorInfo;
SensorInfo getSensorInfo(char input[]);
typedef enum {
  DIGITAL
} IO_TYPES;


typedef enum {
  ITEM0 = 100,
  ITEM1,
  ITEM2 = 120,
  ITEM3,
  ITEM4
  
} SHIFTED_ENUM;

const byte ANALOG = 0;


typedef struct SInfo
{
    byte IN; //Pin number or I2C_IN_TYPE
    byte val_type;
    float val;
};
