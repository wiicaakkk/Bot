const router = require("express").Router();
const fs = require("fs");
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const Table = require("easy-table");
const moment = require('moment')
const { date } = require("./data");
const Excel = require("exceljs")
const axios = require("axios");

const libPath = "C:\\oracle\\instantclient_21_8";
const dbConfig = require("../config/dbconfig");

if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

let count = 0;
let defaultInfo = { day         : "",
                    sunday      : "",
                    currentDate : "",
                    prevDate    : "",
                    nextDate    : "",
                    dateNow     : "",
                    endOfMonth  : "",
                    thisMonth   : ""};
const test = async (message, type, number, changeDate) => {
  //    date(changeDate)
  const workbook = new Excel.Workbook();
  
  const getInfo = (info) => {
    // console.log(info, "1");
    defaultInfo = info
  }

  let dailyStmnts = [];
  let checkStmnts = [];
  let sqlQuery;
  let query;
  if(type == "daily"){
    dailyStmnts = date(changeDate, type, getInfo);
    sqlQuery = [...dailyStmnts];
    query = sqlQuery[parseInt(number)]?.query;
  }else if(type == "check"){
    checkStmnts = date(changeDate, type, getInfo);
    sqlQuery = [...checkStmnts];
    query = sqlQuery[parseInt(number)];
  }
  


  axios.post('http://localhost:4567', {
    query: query,
    user: 'cbssel',
    password: 'inni0821'
  }).then(result => {
    if (type === "check") {
      if(number >= 5 && number < 7){
        message.reply(`Please Wait, this process might take a while`);
      }
      if(number == 7){
        message.reply(`Day Info
day         : ${defaultInfo.day        }
sunday      : ${defaultInfo.sunday     }
currentDate : ${defaultInfo.currentDate}
prevDate    : ${defaultInfo.prevDate   }
nextDate    : ${defaultInfo.nextDate   }
dateNow     : ${defaultInfo.dateNow    }
endOfMonth  : ${defaultInfo.endOfMonth }
thisMonth   : ${defaultInfo.thisMonth  }`);
      }

      console.log(checkStmnts[parseInt(number)]);

      const response = result.data.map((val) => {
        if (number == "0") {
          return;
        }
        else if(number >= 2){
          if(number == 4 || number == 10){

            var test = moment(val.PROC_DT).format("MM/DD/YYYY")
            
            if(number == 4){
              var pgmId = val.PGM.substring(7)
              return{
                ...val,
                PROC_DT: test,
                PGM : pgmId,
                EXECUTION_TIME_MINUTE : val.EXECUTION_TIME_MINUTE.toString().substring(0,4),
              };
            }
            return{
              ...val,
              PROC_DT: test,
            };
          }else if(number == 3){
            var date = moment(val.TODAY).format("dddd MMMM Do YYYY")
            return{
              ...val,
              TODAY: date,
            };
          }
          else{
            return;
          }
        }
        else{
          if (val?.CLS_BIT == null) {
            return {
              ...val,
              CLS_BIT: "Open",
            };
          } else if (val?.CLS_BIT.substring(0, 6) == "202020" || val?.BON_CLSGB == "1") {
            return {
              ...val,
              CLS_BIT: "Close",
            };
          } else if(val?.BON_CLSGB == "9"){
            return{
              ...val,
              CLS_BIT: "Error",
            }
          } 
          else {
            return {
              ...val,
              CLS_BIT: "On Progress",
            };
          }
        }
      });

      if (number == "0") {
        const wamessage = result.data[0].COUNT;

        const sendwa = `bfcount ${wamessage}, perkiraan waktu ${Math.ceil(
          wamessage / 5000
        )} menit`;

        message.reply(sendwa.toString());
        message.reply(Table.print(result.data));
        return;
      }
      else if(number >= 2){
        if(number == 4 || number == 3 || number == 10){
          message.reply(Table.print(response));
        }else{
          message.reply(Table.print(result.data));
        }
        return;
      } else {
        const waSend = Table.print(response);
        message.reply(waSend);
      }
    }
    else if (type === "daily") 
      {

      message.reply(
        `Table selected : ${
          dailyStmnts[parseInt(number)]?.name
        }`
      );
      console.log(dailyStmnts[parseInt(number)]?.query);

      console.log("Done");

      let response = result.data;

      if(number >= 16){
        response = result.data.map((val) => {
          var date = moment(val.PROC_DT).format("MM/DD/YYYY");
          var strDate = moment(val.STR_DT).format("MM/DD/YYYY");
          var endDate = moment(val.END_DT).format("MM/DD/YYYY");
          return{
            ...val,
            PROC_DT: date,
            STR_DT: strDate,
            END_DT: endDate
          };
        })
      }

      const waSend = Table.print(response);

      const rows = `Data pada ${
        dailyStmnts[parseInt(number)].name
      } ini sejumlah ${result.data.length} row`;

      // console.log(Table.print(response));
      message.reply(waSend);
      message.reply(rows);
    }
  
  }).catch(err => {
    console.error('Error:', err.message);
    // clearInterval(interval);
  });

/*
  const connection = await oracledb.getConnection(dbConfig);
  try {
    if (type === "check") {
      if(number >= 5 && number < 7){
        message.reply(`Please Wait, this process might take a while`);
      }
      if(number == 7){
        message.reply(`Day Info
day         : ${defaultInfo.day        }
sunday      : ${defaultInfo.sunday     }
currentDate : ${defaultInfo.currentDate}
prevDate    : ${defaultInfo.prevDate   }
nextDate    : ${defaultInfo.nextDate   }
dateNow     : ${defaultInfo.dateNow    }
endOfMonth  : ${defaultInfo.endOfMonth }
thisMonth   : ${defaultInfo.thisMonth  }`);
      }

      console.log(checkStmnts[parseInt(number)]);

      const result = await connection.execute(checkStmnts[parseInt(number)]);
      //console.log(connection._inProgress);
      connection.release();
      // console.log(result.rows);
      const response = result.rows.map((val) => {
        if (number == "0") {
          return;
        }
        else if(number >= 2){
          if(number == 4 || number == 10){

            var test = moment(val.PROC_DT).format("MM/DD/YYYY")
            
            if(number == 4){
              var pgmId = val.PGM.substring(7)
              return{
                ...val,
                PROC_DT: test,
                PGM : pgmId,
                EXECUTION_TIME_MINUTE : val.EXECUTION_TIME_MINUTE.toString().substring(0,4),
              };
            }
            return{
              ...val,
              PROC_DT: test,
            };
          }else if(number == 3){
            var date = moment(val.TODAY).format("dddd MMMM Do YYYY")
            return{
              ...val,
              TODAY: date,
            };
          }
          else{
            return;
          }
        }
        else{
          if (val?.CLS_BIT == null) {
            return {
              ...val,
              CLS_BIT: "Open",
            };
          } else if (val?.CLS_BIT.substring(0, 6) == "202020" || val?.BON_CLSGB == "1") {
            return {
              ...val,
              CLS_BIT: "Close",
            };
          } else if(val?.BON_CLSGB == "9"){
            return{
              ...val,
              CLS_BIT: "Error",
            }
          } 
          else {
            return {
              ...val,
              CLS_BIT: "On Progress",
            };
          }
        }
      });

      if (number == "0") {
        const wamessage = result.rows[0].COUNT;

        const sendwa = `bfcount ${wamessage}, perkiraan waktu ${Math.ceil(
          wamessage / 5000
        )} menit`;

        message.reply(sendwa.toString());
        message.reply(Table.print(result.rows));
        return;
      }
      else if(number >= 2){
        if(number == 4 || number == 3 || number == 10){
          message.reply(Table.print(response));
        }else{
          message.reply(Table.print(result.rows));
        }
        return;
      } else {
        const waSend = Table.print(response);
        message.reply(waSend);
      }
    }
    else if (type === "daily") 
      {
      let time = 0;
      let result;

      var interval = setInterval(() => {
        time += 1;
        message.reply(`check in progress. Time elapsed ${time} minutes`);
      }, 60000);

      message.reply(
        `Table selected : ${
          dailyStmnts[parseInt(number)]?.name
        } process will be updated every 1 minute. please wait`
      );
      // connection.callTimeout = 10 * 1000;
      console.log(dailyStmnts[parseInt(number)]?.query);


      //result = await connection.execute(dailyStmnts[parseInt(number)]?.query);

      clearInterval(interval);

      connection.release();
      console.log("Done");
      //   console.log(connection);
      let response = result.rows;

      if(number >= 16){
        response = result.rows.map((val) => {
          var date = moment(val.PROC_DT).format("MM/DD/YYYY");
          var strDate = moment(val.STR_DT).format("MM/DD/YYYY");
          var endDate = moment(val.END_DT).format("MM/DD/YYYY");
          return{
            ...val,
            PROC_DT: date,
            STR_DT: strDate,
            END_DT: endDate
          };
        })
      }

      const waSend = Table.print(response);

      const rows = `Data pada ${
        dailyStmnts[parseInt(number)].name
      } ini sejumlah ${result.rows.length} row`;

      // console.log(Table.print(response));

      message.reply(waSend);
      message.reply(rows);
    }
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    clearInterval(interval);
    // connection.close();
    connection.release();
  }
*/
 };

//////////////////////////////
// Check All Daily Schedule //
//////////////////////////////

const testAll = async (message, type, changeDate) => {
    const dateSch = moment(Date.now()).format('YYYY/MM/DD');
    const getInfo = (info) => {
      // console.log(info, "1");
      defaultInfo = info
    };
    const dailyStmnts = date(changeDate, type, getInfo);
    const res = [];
    const workbook = new Excel.Workbook();

    let summary = `Summary Daily Schedule (${dateSch}) \n`;

    count++;
    
    if (count > 1) {
      message.reply("Sorry, this command is already Running. Please wait for previous command to finish")
      return;
    }

    const connection = await oracledb.getConnection(dbConfig);

  try {
      let time = 0;
      let cnt = 0;
      let result;
      message.reply(`Get All data progress Start. Please wait!`);

      var interval = setInterval(() => {
        time += 5;
        message.reply(`check in progress. Time elapsed ${time} minutes`);
      }, 300000);

      let i = 0;

      while (i < dailyStmnts.length) {

        if((i+1) % 5 == 0){
          message.reply(`${i+1}. ${dailyStmnts[i]?.name}`);
        }

        result = await connection.execute(dailyStmnts[i]?.query);

        const response = result.rows;
        const waSend = Table.print(response);

        if (result.rows.length != 0) {
          //Create new Worksheet
          cnt ++;
          const worksheet = workbook.addWorksheet(`${dailyStmnts[parseInt(i)].name}`);
          const newCol = result?.metaData.map((val) => {
            return{
              header : val.name,
              key: val.name,
              width : val.name.length > 10 ? val.name.toString().length : 10,
              numFmt: '@'
            }
          })    
          worksheet.columns = newCol

          response.map((val) => {

            if(i >= 16 ){
              var date = moment(val.PROC_DT).format("MM/DD/YYYY");
              var strDate = moment(val.STR_DT).format("MM/DD/YYYY");
              var endDate = moment(val.END_DT).format("MM/DD/YYYY");
              val = {...val,
              PROC_DT: date,
              STR_DT: strDate,
              END_DT: endDate}
              }else if(i == 14){
                var date = moment(val.PROC_DT).format("MM/DD/YYYY");
                val =  {...val,
                  PROC_DT: date}
              }
            worksheet.addRow(val)
          })
          const rows = `${cnt}. ${
            dailyStmnts[i].name
          } (${result.rows.length} Rows)`;

          summary += `${rows}\n`
        }
        i++;
      }
            
      connection.release();
      clearInterval(interval);
      count = 0;

      const checkSum = summary.split("\n")

      if(checkSum.length > 2){
        // save under export.xlsx
        await workbook.xlsx.writeFile('DailySchedule.xlsx');
        const media = MessageMedia.fromFilePath('./DailySchedule.xlsx');
        message.reply(media);
        message.reply(summary);
      }else{
        message.reply(summary+"No Data Found");
      }
   
  } catch (error) {
    console.log(error);
    message.reply("wrong command");
    count = 0;
    clearInterval(interval);
    connection.release();
  }
};

module.exports = { test, testAll };