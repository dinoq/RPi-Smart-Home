/*
  Get basic environmental readings from the BME280
  By: Nathan Seidle
  SparkFun Electronics
  Date: March 9th, 2018
  License: This code is public domain but you buy me a beer if you use this and we meet someday (Beerware license).

  Feel like supporting our work? Buy a board from SparkFun!
  https://www.sparkfun.com/products/14348 - Qwiic Combo Board
  https://www.sparkfun.com/products/13676 - BME280 Breakout Board
  
  This example shows how to read humidity, pressure, and current temperature from the BME280 over I2C.

  Hardware connections:
  BME280 -> Arduino
  GND -> GND
  3.3 -> 3.3
  SDA -> A4
  SCL -> A5
*/

#include <Wire.h>

#include "SparkFunBME280.h"
BME280 mySensor;

void setup()
{
  Serial.begin(9600);
  Serial.println("Reading basic values from BME280");

  Wire.begin();

  if (mySensor.beginI2C() == false) //Begin communication over I2C
  {
    Serial.println("The sensor did not respond. Please check wiring.");
    while(1); //Freeze
  }
}
int t=0;
void loop()
{
  /*
  Serial.print("Humidity: ");
  Serial.print(mySensor.readFloatHumidity(), 0);

  Serial.print(" Pressure: ");
  Serial.print(mySensor.readFloatPressure(), 0);

  Serial.print(" Alt: ");
  Serial.print(mySensor.readFloatAltitudeMeters(), 1);
  //Serial.print(mySensor.readFloatAltitudeFeet(), 1);

  Serial.print(" Temp: ");*/
  if(floor(mySensor.readTempC()*10) != t){
    t=floor(mySensor.readTempC()*10);
    Serial.println(((float) t/10));
    //Serial.println(t);
  }
  delay(50);
}
