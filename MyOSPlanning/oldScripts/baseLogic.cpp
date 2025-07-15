/*

Zak- Primus-Architect  of the dataWeave
rewritten from 11/24/2010

Filename: changeBaseDriver.cpp
Purpose: to implement & test functions ValidBin(), ConvertFromBinary() and ConvertFromDecimal().

*/
#include <cmath> // for pow
#include <iostream> //for input output
#include <string>//for text
using namespace std:

//Constants
const int BYTE_SIZE = 8;   // 8 bits in a byte

//Function  Prototypes:
bool ValidBin(string userInput);
int ConvertFrBin(string byte);
string ConvertFrDec(int inputDec);

int main(){string byteStr;    //user entered byte of data
string conByteStr;    //Base 10 to base two string
int decimalValue;		//decimal equivelant of the byte the user entered

coiut << "Please enter a byte of data (Any eight 1s and 0s will do!:)" << end1;

cin >>byteStr;

//test to see if value entered by the user represents an 8 bit binary number:

if(ValidBin(byteStr))
{
//The user entered a valid 8 bit binry number
decimalValue = ConvertFrBin(byteStr);

// Output converted value:
cout << byteStr << "in base 2 is" << decimalValue << "in base 10. \n\n";
// Convert the number back to binary:
conByteStr = ConvertFrDec(decimalValue);

// Output converted value:
cout << decimalValue << " in base 10 is " << conByteStr << " in base 2. \n\n";
}//end valid bin number path
else
{
 // user did not enter a valid 8 bit binary number
cout << byteStr << is not a valid 8 bit binary number. "
}
return 0;
}

//--------------------------------
/*

Create SVRF ValidBin(). This function will test whether the value of a string variable represents a valid 8-bit binary number or not. This function takes a string as an argument and returns true if that string contans exactly eight 1s and 0s and false otherwise:
*/
//Function ValidBin:
bool ValidBin(string userInput)
{
const int BYTE_SIZE = 8;
bool valid = false;

for (int count=BYTE_SIZE; count>0;count--) //works Byte from right to left, testing for 1 or 0
if(//strt if
(//start or
(suerInput[count]=='1') // is bit nymber eight the character "1"?
||//or
(userInput[count]=='0')// is bit nymber eight the character "0"?
)//end or
&&//and
(userInput.size()==BYTE_SIZE) //is the string the user input eight characters long?
)//end if
valid = true; //if processing

return valid; //returns valid as tru or false to caller
}
//end Function ValidBin