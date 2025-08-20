const qrcode = require("qrcode-terminal");
var QRCode = require('qrcode')
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const http = require('http');

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { test, testAll } = require("./src/routers");
// const {users} = require("./src/config/users.js");
const axiosInstance = require("./src/config/axios");
const axios = require('axios');
const moment = require('moment');
const Table = require("easy-table");
const { log } = require("easy-table");

const wwebVersion = '2.2411.2'

const client = new Client({
  authStrategy: new LocalAuth(),
  restartOnAuthFail: true,
  puppeteer: {
      headless: true,
  }
});

var response

const isAlphabet = (str)=>{
  const regex = /^[a-zA-Z]+$/; 

  return regex.test(str);
}

const getUser = async (phone = "") => {
  try{
    let {data} = await axiosInstance.get(`allowedUsers${phone.length > 1? "?phone=" + phone : ""}`);
    return data;
  }
  catch(err){
    return
  }
}

const getUserByName = async (name = "") => {
  try{
    let {data} = await axiosInstance.get(`allowedUsers${name.length > 1? "?name=" + name : ""}`);
    return data;
  }
  catch(err){
    return
  }
}

const addUser = async (newData) => {
  try {
    await axiosInstance.post("allowedUsers", newData)
  } catch (err) {
    return
  }
}

const patchUser = async (id,newData) => {
  try {
    await axiosInstance.patch(`allowedUsers/${id}`, newData)
  } catch (err) {
    return
  }
}

const deleteUser = async (id) => {
  try {
    await axiosInstance.delete(`allowedUsers/${id}`)
  } catch (err) {
    return
  }
}

client.on("qr", async (qr) => {
  console.log("TEST 1");
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on("ready", async () => {
  console.log("Client is ready!");
  const version = await client.getWWebVersion();
  console.log(`WWeb v${version}`);
});

let i = 0;


client.on("message", async (message) => {
  const groupChat = await message.getChat();

  if(groupChat.name != "DAILY"){
    return;
  }

  let boole = false;
  let admin = false;
  const content = message.body;

  if(content[0] != '!'){
    return
  }

  if(message.author){
    var sender = await message.getContact();
    // if(sender[0] == 6281291757299){
    //   message.reply(`Maaf Anda Siapa?`);
    //   return
    // }
  }else{
    return
  }

  const users = await getUser();

  users?.forEach((val) => {
    if(val.phone == sender.number){
      boole = true
      if(val.isAdmin == true){
        admin = true
      }
    }
  })

 if(!boole){
  return;
 }

  const msgAdd = message.body.split(" ");
 
  if(admin){
    if(msgAdd[0] == "!add"){
      let data = await getUser(msgAdd[2]);
      if(data.length < 1){
        let newUser = {
          phone : msgAdd[2],
          name : msgAdd[1],
          isAdmin : msgAdd[3] == "admin"? true : false
        }
        await addUser(newUser);
        message.reply(`New ${msgAdd[3]=="admin"? "Admin" : "User"} (${msgAdd[1]}) Added Successfully`)
      }else{
        message.reply(`Phone no (${msgAdd[2]}) Already used`)
      }
      return;
    }else if(msgAdd[0] == "!promote" || msgAdd[0] == "!demote" ){
      let data;
      if(!isAlphabet(msgAdd[1])){
        data = await getUser(msgAdd[1]);
      }else{
        data = await getUserByName(msgAdd[1].toUpperCase())
      }
    
      if(data.length > 0){
        if(data[0].id == 1){
          message.reply(`Anda tidak berwenang hey`);
          return;
        }
        let newUser = {
          isAdmin :  msgAdd[0] == "!promote"? true : false
        }
        await patchUser(data[0].id,newUser);
        
        message.reply(`${data[0].name} Has been ${ msgAdd[0] == "!promote"? "promoted to Admin!" : "demoted to User!"}`)
      }else{
        message.reply(`No such user exist`)
      }

      return;
    }else if(msgAdd[0] == "!remove"){
      let data = await getUser(msgAdd[1]);
      if(data[0].id == 1){
        message.reply(`Anda tidak berwenang hey`);
        return;
      }
      if(data.length > 0){
        await deleteUser(data[0].id);
        message.reply(`User ${data[0].name} Has been removed!`) 
      }else{
        message.reply(`No such user exist`)
      }
      return;
    }
  }

  if(content == '!connect'){
    type = content.substring(1, 8).toLowerCase();
  }
  else if(content.length  <= 6 ){
    var type = content.substring(1, 4).toLowerCase();
    // let number = parseInt(content.substring(3, 5)) - 1;
    var changeDate = content.substring(4, 6);
  }else if (content.length  <= 11){
    var type = content.substring(1, 6).toLowerCase();
    var number = parseInt(content.substring(6, 8)) - 1;
    var changeDate = content.substring(8, 11);
  }else if(content.substring(0,4) == "!RTL" && admin){
    var type = content;
  }
  else {
    return;
  }

  if(content.substring(1,5).toLowerCase() == "list"){
    var type = content.substring(1,5).toLowerCase();
  }else if(content.substring(1,7).toLowerCase() == "create"){
    console.log("create");
    var string = content.split(" ");
    var type = string[0].toLowerCase();
    var number = string[1];
    if(isNaN(number)){
      return;
    }
  }

  /* TESTING JDBC BRIDGE */
  if(type == "connect")
  {
    const extPath = `C:\\Users\\rizky\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\bhghoamapcdpbohphigoooaddinpkbai\\8.0.1_0`
    //const command = `start chrome --remote-debugging-port=9222 --load-extension="${extPath}" --user-data-dir="C:\\ChromeDebug" "https://querypie.okbank.co.id:8443/login/agent"`;
    const command = `start chrome --remote-debugging-port=9222 --load-extension="${extPath}" --user-data-dir="C:\\ChromeDebug" "http://172.30.98.158/login/agent"`;

// Step 1: Launch Chrome with remote debugging enabled
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

// Step 2: Wait for Chrome debugger to be available
const waitForDebugger = (retries = 20) => {
  return new Promise((resolve, reject) => {
    const check = () => {
      console.log("🔄 Checking Chrome debugger...");

      http.get('http://127.0.0.1:9222/json/version', res => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.webSocketDebuggerUrl) {
              console.log("✅ Chrome debugger is ready.");
              resolve();
            } else {
              console.log("⚠️ No debugger URL found, retrying...");
              retry();
            }
          } catch (e) {
            console.log("⚠️ Failed to parse debugger JSON, retrying...");
            retry();
          }
        });
      }).on('error', (err) => {
        console.log("❌ Error connecting:", err.message);
        retry();
      });
    };

    const retry = () => {
      if (retries-- > 0) {
        setTimeout(check, 500);
      } else {
        reject(new Error('Chrome debugger not available'));
      }
    };

    check();
  });
};

// Step 3–8: Automate OTP entry
(async () => {
  try {
    
    await waitForDebugger();

    console.log("🔌 Connecting to Chrome...");
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222'
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
    const pages = await browser.pages();

    console.log("Pages count", pages.length);
    console.log(pages[0], pages[1]);

    // if (pages.length > 0) {
    //   const currentPage = pages[1]; // Get the first open page
    
    //   // Close the current page
    //   await currentPage.close();
    //   console.log("Closed the current page.");
    // } else {
    //   console.error("No pages are currently open.");
    // }

    const loginPage = pages.find(p => p.url().includes('172.30.98.158'));

    if (!loginPage) {
      throw new Error("Login page not found.");
    }

    await loginPage.bringToFront();

    console.log('⏳ Waiting 5 seconds before continuing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    //await loginPage.waitForSelector('#id');
    //await loginPage.type('#id', "bagus.nurjayanto");

    //await loginPage.waitForSelector('#password');
    //await loginPage.type('#password', "okbank@26");
    //await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('⏎ Pressing Enter...');
    await loginPage.keyboard.press('Enter');

    console.log('WAIT 3 SECONDS');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Open the Authenticator extension tab
    const extensionUrl = 'chrome-extension://bhghoamapcdpbohphigoooaddinpkbai/view/popup.html';
    const extPage = await browser.newPage();
    await extPage.goto(extensionUrl);

    // Step 5: Extract the OTP code
    await extPage.waitForSelector('.code');
    const otpCode = await extPage.evaluate(() => {
      const el = document.querySelector('.code');
      return el ? el.textContent.trim() : null;
    });

    console.log("🔐 OTP Retrieved:", otpCode);

    // Step 6: Paste the OTP into the login page
    await loginPage.bringToFront();
    await loginPage.waitForSelector('#authenticationCode');
    await loginPage.type('#authenticationCode', otpCode);

    console.log('✅ OTP filled in successfully.');

    // Optional: Click a submit button here if needed
    await loginPage.keyboard.press('Enter');
    
    // Step 7: Close everything
    await extPage.close();
    console.log('🧹 Closed extension tab.');
    
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    //await loginPage.keyboard.press('Tab');
    //.querySelector('button').click();
    //await new Promise(resolve => setTimeout(resolve, 1000));
    //await loginPage.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await browser.close();
    console.log('🛑 Browser closed.');
    message.reply("Udah connect nih bang, monggo");

  } catch (e) {
    console.error('❌ Error:', e.message);
    message.reply(`Error : `,e.message);
  }
})();

    // // Command to start Chrome with remote debugging enabled
    // const command = 'start chrome --remote-debugging-port=9222 --user-data-dir="C:\\ChromeDebug" "https://querypie.okbank.co.id:8443/login/agent"';
    
    // exec(command, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`exec error: ${error}`);
    //     return;
    //   }
    //   if (stderr) {
    //     console.error(`stderr: ${stderr}`);
    //     return;
    //   }
    //   console.log(`stdout: ${stdout}`);
    // });

    // const waitForDebugger = (retries = 20) => {
    //   return new Promise((resolve, reject) => {
    //     const check = () => {
    //       console.log("check on process");
          
    //       http.get('http://127.0.0.1:9222/json/version', res => {
    //         let data = '';
            
    //         res.on('data', chunk => data += chunk);
    //         res.on('end', () => {
    //           try {
    //             const json = JSON.parse(data);
    //             if (json.webSocketDebuggerUrl) {
    //               console.log("✅ Chrome debugger is ready.");
    //               resolve();
    //             } else {
    //               console.log("⚠️ No debugger URL found, retrying...");
    //               retry();
    //             }
    //           } catch (e) {
    //             console.log("⚠️ Failed to parse debugger JSON, retrying...");
    //             retry();
    //           }
    //         });
    //       }).on('error', (err) => {
    //         console.log("❌ Error connecting:", err.message);
    //         retry();
    //       });
    //     };
    
    //     const retry = () => {
    //       if (retries-- > 0) {
    //         setTimeout(check, 500);
    //       } else {
    //         reject(new Error('Chrome debugger not available'));
    //       }
    //     };
    
    //     check();
    //   });
    // };

    // (async () => {
    //   try{
    //     console.log("wait for debugger");
    //     await waitForDebugger();
    //     console.log('Connected to Chrome DevTools.');

    //     const browser = await puppeteer.connect({
    //       browserURL: `http://127.0.0.1:9222`
    //     });
    
    //     const [page] = await browser.pages();
    
    //     console.log('Waiting 5 seconds...');
    //     await new Promise(resolve => setTimeout(resolve, 5000));
    
    //     console.log('Pressing Enter...');
    //     await page.keyboard.press('Enter');

    //     console.log('Waiting 5 seconds...');
    //     await new Promise(resolve => setTimeout(resolve, 5000));
    
    //     console.log('Closing browser...');
    //     await browser.close();

    //     message.reply("Udah connect nih bang, monggo");
    //   }catch(e){
    //     console.error('❌ Error:', e.message);
    //   }})();
  }

  if((type == "check" && number == 8) && !admin){
      return;
  }

  if (type === "check" || type === "daily") {
    if (number == "-1") {
      return;
    } else {
      test(message, type, number, changeDate);
    }
  } else if (type === "all" || type === "all-1") {
    // console.log('disini')
    // console.log(content)
    testAll(message, type, changeDate);
  } else if (type === "list") {
    message.reply(`
Command List :
Check Branch / BF_Count : Format "!check(number)"
1. BF_Count
2. Open/Close Branch
3. CM701, CM301, CM603
4. Change Date
5. Batch Accrual P2P
6. Remain Count Acr P2P 
7. Shellscript Batch Accrual P2P
8. Auto Debit 1108 *"!check0816" 16 --> jam batch*
9. P2P Repayment Status
10. Bulk Temp
11. Check Unused 

Daily Schedule: Format "!daily(number)"
1. After Close Branch
2. Allocation Collateral
3. Accrual Have Normal Accrual Bal
4. Accrual Have Npl Acrrual Bal
5. Npl Acrual And Normal AccrualBal
6. Npl Have Normal Accrual Or Non Npl Have Npl Accrual
7. Transaction Backdate
8. Close Account Have balance
9. Giro Prk Cancel Check
10. Gl Balance Check
11. Gl Balance Vs TrxBal
12. Liabilty Minus Check
13. Loan Base NS with Loan Sch
14. Loan Batch Payment Process
15. Ot Batch Check
16. Wrong Amort
17. Check Batch Job 1st Day
18. Check Batch job Monday
19. Check Batch Job Tue - Fri`);
  }else if(type == "!create"){
    console.log("reply");

    var date = moment(Date.now()).format("YYYY/MM/DD");
    var date1 = moment(Date.now()).format("YYYYMMDD");
    message.reply(`/app/tmax//batchbin/otb6203_p2p Y 1108ID0000${number.length == 1 ? "0" + number : number} OT6203_P2P 02 1108 ${date} B0888U1 2 N Y N 999999999999999 99 ${number} >> /inoan/log/batlog/OTB6203_P2P_1108_${date1}_${number}.log`);
  }else if(type.substring(0,4) == "!RTL"){
    var date1 = moment(Date.now()).format("YYYYMMDD");
    var arrRtl = type.substring(1,type.length).split(`\n`);

    let msg = ``;

    for (let i = 0; i < arrRtl.length; i++) {
      const RTL = arrRtl[i];
      msg += `${i != 0 ? '\n\n':''}/app/tmax/batchbin/rlb1000 ${RTL} >> /inoan/log/batlog/rlb1000_${RTL}_${date1}.log`;
    }
    message.reply(msg);
  }
});

client.initialize();
