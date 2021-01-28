
let z = 36;//max 36/62//zaklad
let n = 4102444800;//4294967295; //Převáděné cislo
console.log("---------------");
//console.log(n.toString(z));//vestavena funkce - max. zaklad = 36
let res = "";
while(n!=0) 
    {    
        // temporary variable to store remainder 
        let temp  = 0; 
          
        // storing remainder in temp variable. 
        temp = n % z; 
        // check if temp < 10 
        if(temp < 10) 
        { 
        res+=String.fromCharCode(temp + 48);
        
        } 
        else if(temp < 36)
        { 
        res+=String.fromCharCode(temp + 55);
        } 
        else{
        res+=String.fromCharCode(temp + 61);
        }
          
        n = Math.floor(n/z); 
    } 
    console.log(res.split("").reverse().join(""));