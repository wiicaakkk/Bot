/**********************************/
/* FIND MISSING NUMBER FROM ARRAY */
/**********************************/
       /* GIVEN ARRAY */

// const numbers = [6, 9, 2, 12];

// const findMissingNumbers = (numbers) => {
//   const missEvenNumbers = [];
//   const missOddNumbers = [];
  
//     const maxNum = Math.max(...numbers);
//     const minNum = Math.min(...numbers);
  
//     for (let i = minNum ; i < maxNum; i++) {
//       if(!numbers.includes(i) && (i % 2 == 0)){
//         missEvenNumbers.push(i);
//       }else if(!numbers.includes(i)){
//         missOddNumbers.push(i);
//       }
//     }
//     return ([missEvenNumbers,missOddNumbers])
//   } 

//   console.log(findMissingNumbers(numbers));

/********************************/
/* FIND LOWEST SUM OF 2 NUMBERS */
/********************************/
  // Given array

// const numbers = [5,2,7,3,9,1,10];   

//   let obj = [];

//   numbers.forEach((number, index) => {
//     for (let i = index+1; i < numbers.length; i++) {
//         let data = {sum: number + numbers[i],
//                     numA: number,
//                     numB: numbers[i]}
//         obj.push(data);
//     }
//   });
 
// const minSum = Math.min(...obj.map((val) =>  val.sum))

// const awok = obj.find((val) => val.sum == minSum)

// console.log(awok)

// let num = []
// let sum = 0;

// for (let j = 0; j < numbers.length; j++) {
//     for (let k = j + 1; k < numbers.length - 1; k++) {
//         let curSum = numbers[j] + numbers[k]

//         if(curSum < sum || sum == 0){
//             num = [numbers[j], numbers[k]]
//             sum = curSum
//         }
//     }
// }
// console.log(num);

/****************************************/
/* FIND SUM OF NUMBER THAT MATCH TARGET */
/****************************************/

const numbers = [2,4,6,8,10];
console.log(numbers.sort());
// const target = 10;

// let answer = [];
// numbers.forEach((number, index) => {
// for (let i = index+1; i < numbers.length; i++) {
//       if(number + numbers[i] == target){
//         answer.push([number, numbers[i]])
//       }
//     }
// })
// console.log(answer);

/* ********** */
/* MATRIX SUM */
/* ********** */

// const matrix = [
//     [1, 2, 3],
//     [4, 5, 6],
//     [7, 8, 9]
//   ];

// let total = 0

// matrix.forEach((val, i) => {
//     val?.forEach((num, j) =>{
//       if(i == j){
//         total += num
//       }
//     })
//   })

// const test = matrix.reduce((num, cur, i) => {
//     return num + cur[i]
//   },0)

//   console.log(test);


/******************************************/
/* RETURN THE FIRST NON CONTINUING STRING */
/******************************************/
// const text = "5730000"

// console.log(text.substring(1, 3))


// const palindrome = ((str) => {
//   let strLow = str.toLowerCase();

//   let strArr = strLow.split("").reverse().join("");
//   console.log(strArr);
//   return (strArr !== strLow) ? false : true;
// }) 

// console.log(palindrome('12321'));


// function greet(name) {
//   if ((!(NaN !== NaN)) ? false : true / (Math.sin(90 * Math.PI / 180))) {
//     const 山 = '010101h01H1010h1010'
//     const 人 = '0e1r0010100e010101001010'
//     const 口 = '0l101l0101111000001010100010010'
//     const 刀 = 'dl001l1011010101011010111100010101'
//     const 目 = '1d000y10100101101011111100001011110010110101111000000010010101'
//     const 日 = '01101o11110001001010100010110101111000011010111100010010000100010'
//     const 女 = 'o00a1d10101000101001011010111100010010101010100010100100010010101010100101'
//     const 鳥 = '0t010o01010111100001010010110101111000100101010100010111110001010101001010010'
//     const 子 = 'y0101g00101111111101111000100101010010111100010011101010100010100101101011110001010'
//     const 木 = '10101o001011111111010111100010010101010001010010110111101111000101010111100000101000101001011'
//     const 水 = 'o010100101011101010111001000101001010111010101110010001010010101110101011101010111100010010101010100101001'
//     const 月 = 'wu01011101010111001010110101010101000101001010111010101110010101101010101010001010010101110101011100101011101'
//     const 沐 = '1010101010010101010101010101010101010101 doing 0101010101010101010101010100101010110010101010101010101011010101010 '
//     const thisIsSupposedToBeTheSpaceCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere = ' '
//     const thisIsSupposedToBeTheCommaCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere = ','
//     const thisIsSupposedToBeTheQuestionMarkSignButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere = '?'
    
//     let _a = ''
//     let ____________ = ''
    
//     const _=_a.concat(山.slice(Math.tanh(45)+(Math.max(1, -150, -30, -20, -8, -200))+7)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ___ =_.concat(人.slice(Math.tanh(45)+(Math.max(1, -150, -30, -20, -8, -200))-1,Math.floor(Math.acos(1)+9+1-4/8-8+Math.cos(7))))
//     const _____=___.concat(口.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488)))[[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1]])
//     const _______=_____.concat(口.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488)))[[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1]])
//     const _________=_______.concat(木.slice(5)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const __________=_________.concat(thisIsSupposedToBeTheCommaCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere)
//     const ___________=__________.concat(thisIsSupposedToBeTheSpaceCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere)
//     const _____________ = ____________.concat(山.slice(Math.tanh(45)+(Math.max(1, -150, -30, -20, -8, -200))+4)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ______________ = _____________.concat(日.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488)))[0])
//     const _______________ = ______________.concat(月.slice(Math.floor(Math.acos(1)+9+1-4/8-8+Math.cos(7))-1-1)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ________________ = _______________.concat(thisIsSupposedToBeTheSpaceCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere)
//     const _________________ = ________________.concat(女.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488))-2)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const __________________= _________________.concat(人.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488))-2)[Math.trunc(000+0)])
//     const ___________________=__________________.concat(人.slice(Math.tanh(45)+(Math.max(1, -150, -30, -20, -8, -200))-1,Math.floor(Math.acos(1)+9+1-4/8-8+Math.cos(7))))
//     const ____________________=___________________.concat(thisIsSupposedToBeTheSpaceCharButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere)
//     const _____________________=____________________.concat(子.slice(Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1)[[[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1]]])
//     const ______________________=_____________________.concat(木.slice(5)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const _______________________=______________________.concat(月.slice(Math.floor(Math.acos(1)+9+1+1-4/8-8+Math.cos(7))-1-1)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ________________________=_______________________.concat(沐.slice((Math.tanh(45) + (Math.min(-47, 150, 30, 20, 8, 200)) + 86),Math.trunc(3**2-2+1514-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E)))
//     const _________________________=________________________.concat(鳥.slice(Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))+0)[1+2+3-6])
//     const __________________________=_________________________.concat(水.slice(Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ___________________________=__________________________.concat(目.slice(Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7)))[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const _____________________________=___________________________.concat(女.slice(Math.floor(Math.trunc(3**2-2-1+Math.acos(1)+9-4+Math.cos(7)-1479+Math.LOG10E+2+Math.LN2-32+7+3+999+-11+Math.SQRT2+15-0.4+488))-2)[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1])
//     const ______________________________=_____________________________.concat(子.slice(Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1)[[[Math.floor(Math.acos(1)+9-4/8-8+Math.cos(7))-1]]])
//     const _______________________________=______________________________.concat(thisIsSupposedToBeTheQuestionMarkSignButSadlyJavaScriptDoesntAllowMeToNameMyVariableAsSuchSorryGuysGottaBreakThePatternHere)
    
//     return `${__________} ${name} ${_______________________________}`}}

//     console.log(greet("john doe"));