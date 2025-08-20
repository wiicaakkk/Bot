// const moment = require('moment')


// const day = moment(Date.now()).format("dddd");

// const sunday = moment(Date.now()).startOf('week').format("YYYYMMDD");
// const currentDate = moment(Date.now()).format("YYYYMMDD");

// const prevDate = (moment(Date.now()).format("YYYYMMDD")-1).toString();
// const prevDateFriday = (moment(Date.now()).format("YYYYMMDD")-3).toString();

// const nextDate = moment(Date.now()).add(1, 'days').format("YYYY/MM/DD").toString();
// const nextDateMonday = (moment(Date.now()).add(3, 'days').format("YYYY/MM/DD")).toString();

// const dateNow = moment(Date.now()).format("DD");
// const endOfMonth = moment(Date.now()).endOf('month').format('DD');

// const thisMonth = moment(Date.now()).format("YYYYMM");



// var sql = `
// SELECT COUNT(*)
// FROM   (
//             SELECT Z9.RUN_DT
//                    ,Z9.CUST_ENM
//                    ,Z9.FR_ACCT_NO
//                    ,Z9.TO_REF_NO
//                    ,Z9.FR_CIX_NO
//                    ,Z9.CIX_NO
//                    ,Z9.REMARK
//                    ,Z9.COM_ID        AS PRODUCT_ID
//                    ,Z9.COM_NM        AS PRODUCT_NM
//                    ,Z9.REAL_EXP_IL   AS END_DATE
//                    ,Z9.NX_REPAY_IL   AS NEXT_PRN_DT
//                    ,Z9.NX_ISU_IL     AS NEXT_INT_DT
//                    ,Z9.GRACE_DAYS
//               FROM (
//                     SELECT Z.*
//                       FROM (
//                             SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
//                                    DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
//                                         AS run_sys_dttm
//                                  , CASE WHEN B.ref_no IS     NULL THEN 'N'
//                                         WHEN B.ref_no IS NOT NULL
//                                          AND B.sts <> '0'         THEN 'Y'
//                                         ELSE                           'P'
//                                    END  AS run_flag
//                                  , CASE WHEN A.due_type = 'D' THEN TO_DATE('${currentDate}','YYYYMMDD')   /* Current Day */
//                                         WHEN A.due_type = 'W' THEN TO_DATE('${sunday}','YYYYMMDD') + A.due_day            /* Sunday Day */
//                                         WHEN A.due_type = 'M' THEN CASE WHEN A.due_day > TO_NUMBER(${endOfMonth})                                   /* Current Last Day per Month */
//                                                                         THEN TO_DATE('${thisMonth}' || '${endOfMonth}','YYYYMMDD')                          /* Current Year & Month / / Current Last Day per Month */
//                                                                         ELSE TO_DATE('${thisMonth}' || '${dateNow}'      ,'YYYYMMDD') + A.due_day - 1    /* Current Year & Month */
//                                                                    END
//                                         WHEN A.due_type = 'Y' THEN CASE WHEN TO_CHAR(A.opn_dt,'DD')
//                                                                            > TO_CHAR(LAST_DAY(TO_DATE('2023'||TO_CHAR(A.opn_dt,'MM')||'${dateNow}','YYYYMMDD')),'DD')                                  /* Current Year */
//                                                                         THEN LAST_DAY(TO_DATE('2023'||TO_CHAR(A.opn_dt,'MM')||'${dateNow}','YYYYMMDD'))                                  /* Current Year */
//                                                                         ELSE TO_DATE('2023'||TO_CHAR(A.opn_dt,'MMDD'),'YYYYMMDD')                                  /* Current Year */
//                                                                    END
//                                    END  AS run_dt
//                                  , A.*
//                                  , C.CUST_ENM
//                                  , E.COM_ID 
//                                  , E.COM_NM
//                                  , E.REAL_EXP_IL
//                                  , E.NX_REPAY_IL
//                                  , E.NX_ISU_IL
//                                  , E.GRACE_DAYS 
//                               FROM acom_atb_base  A
//                                  , acom_atb_batch B
//                                  , acom_cix_base  C
//                                  , acom_cont_base D
//                                  , adst_lnb_base  E
//                              WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
//                                AND B.ref_no(+)     = A.ref_no
//                                AND B.val_dt(+)     = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
//                                AND B.proc_type(+)  = 'FOTI'
//                                AND A.sts           = '0'
//                                AND A.tr_type      IN ('LN01','LN02','LN03')
//                                AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')        /* Current Day */
//                                AND A.exp_dt       >  TO_DATE('${day == "Monday" ? prevDateFriday : prevDate}','YYYYMMDD')    /* Previous Day */
//                                --AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
//                                AND (A.due_times    = 0
//                                  OR A.due_times    > A.proc_times)
//                                AND A.tr_type       = 'LN03'               /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
//                                AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
//                                AND A.to_ref_no     = D.ref_no
//                                AND D.sts           = '0'
//                                AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
//                                AND D.ref_no        = E.ref_no
//                                AND E.act_gb       != '3'
//                                AND A.ref_no       <> '                    '             /* Previous Run Reference No */
//                            ) Z
//                      WHERE Z.run_dt      >  TO_DATE('${day == "Monday" ? prevDateFriday : prevDate}','YYYYMMDD')    /* Previous Day */
//                        AND Z.run_dt      <= TO_DATE('${currentDate}' ,'YYYYMMDD')      /* Current Day */
//                        AND ((Z.run_flag   = 'N')
//                          OR (Z.run_flag   = 'Y' AND Z.retry_yn = 'Y'))
//                        AND Z.run_sys_dttm < '${currentDate}083003'                   /* Auto Debit Run System Date & Time */
//                     UNION
//                     SELECT Z.*
//                       FROM (
//                             SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
//                                    DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
//                                         AS run_sys_dttm
//                                  , CASE WHEN B.ref_no IS     NULL THEN 'N'
//                                         WHEN B.ref_no IS NOT NULL
//                                          AND B.sts <> '0'         THEN 'Y'
//                                         ELSE                           'P'
//                                    END  AS run_flag
//                                  , CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
//                                         WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
//                                         WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
//                                                                           WHEN E.nx_isu_il > E.nx_repay_il
//                                                                                                    THEN E.nx_repay_il
//                                                                           ELSE E.nx_isu_il
//                                                                      END
//                                    END  AS run_dt
//                                  , A.*
//                                  , C.CUST_ENM
//                                  , E.COM_ID 
//                                  , E.COM_NM
//                                  , E.REAL_EXP_IL
//                                  , E.NX_REPAY_IL
//                                  , E.NX_ISU_IL
//                                  , E.GRACE_DAYS 
//                               FROM acom_atb_base  A
//                                  , acom_atb_batch B
//                                  , acom_cix_base  C
//                                  , acom_cont_base D
//                                  , adst_lnb_base  E
//                              WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
//                                AND B.ref_no(+)     = A.ref_no
//                                AND B.val_dt(+)     = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
//                                AND B.proc_type(+)  = 'FOTI'
//                                AND A.sts           = '0'
// 							   --AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
//                                AND A.tr_type      IN ('LN01','LN02','LN03')
//                                AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')     /* Current Day */
//                                AND A.tr_type       = 'LN03'                    /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
//                                AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
//                                AND A.to_ref_no     = D.ref_no
//                                AND D.sts           = '0'
//                                AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
//                                AND D.ref_no        = E.ref_no
//                                AND E.act_gb       != '3'
//                                AND A.ref_no       <> '                    '             /* Previous Run Reference No */
//                            ) Z
//                      WHERE Z.run_dt       <  TO_DATE('${day == "Friday" ? nextDateMonday : nextDate}','YYYY/MM/DD')       /* Next Day Date */
//                        AND ((Z.run_flag   = 'N')
//                          OR (Z.run_flag   = 'Y' AND Z.retry_yn = 'Y'))
//                        AND Z.run_sys_dttm < '${currentDate}083003'                   /* Auto Debit Run System Date & Time */
//                     UNION
//                     SELECT Z.*
//                       FROM (
//                             SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
//                                    DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
//                                         AS run_sys_dttm
//                                  , 'Y'  AS run_flag
//                                  , CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
//                                         WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
//                                         WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
//                                                                           WHEN E.nx_isu_il > E.nx_repay_il
//                                                                                                    THEN E.nx_repay_il
//                                                                           ELSE E.nx_isu_il
//                                                                      END
//                                    END  AS run_dt
//                                  ,  A.*
//                                  , ''            AS CUST_ENM
//                                  , E.COM_ID 
//                                  , E.COM_NM
//                                  , E.REAL_EXP_IL
//                                  , E.NX_REPAY_IL
//                                  , E.NX_ISU_IL
//                                  , E.GRACE_DAYS 
//                               FROM acom_atb_base  A
//                                  , acom_atb_batch B
//                                  , aact_trx_bal   C
//                                  , adst_lnb_base  E
//                                  ,
//                                  ( SELECT  UNIQUE E.ref_no,
//                                    CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
//                                         WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
//                                         WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
//                                                                           WHEN E.nx_isu_il > E.nx_repay_il
//                                                                                                    THEN E.nx_repay_il
//                                                                           ELSE E.nx_isu_il
//                                                                      END
//                                    END  AS run_dt
//                               FROM acom_atb_base  A
//                                  , acom_atb_batch B
//                                  , acom_cix_base  C
//                                  , acom_cont_base D
//                                  , adst_lnb_base  E
//                              WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
//                                AND B.ref_no        = A.ref_no
//                                AND B.val_dt        = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
//                                AND B.proc_type     = 'FOTI'
//                                AND A.sts           = '0'
//                                AND A.tr_type      IN ('LN01','LN02','LN03')
// 							   --AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
//                                AND A.opn_dt       <= TO_DATE('${prevDate}','YYYYMMDD')     /* Current Day */
//                                AND A.exp_dt       >  TO_DATE('${currentDate}','YYYYMMDD')  /* Previous Day */
//                                AND A.tr_type       = 'LN03'                                   /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
//                                AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
//                                AND A.to_ref_no     = D.ref_no
//                                AND D.sts           = '0'
//                                AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
//                                AND D.ref_no        = E.ref_no       ) F
//                            WHERE A.sts           = '0'
//                              AND A.tr_type      IN ('LN01','LN02','LN03')
//                              AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
//                              AND A.to_ref_no     = F.ref_no
//                              AND F.run_dt       <= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
//                              AND A.tr_type       = 'LN03'                                     /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
//                              AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
//                              AND E.ref_no        = F.ref_no
//                              AND B.ref_no        = A.ref_no
//                              AND B.val_dt        = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
//                              AND B.proc_type     = 'FOTI'
//                              AND C.ref_no        = A.fr_acct_no
//                              AND C.apcl_end_dt   = TO_DATE('99991231','YYMMDD')
//                              AND C.bal_amt      != 0
//                              AND C.dtls_bal_dv_cd IN ('D101','L202')
//                              AND C.apcl_str_dt  >= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
//                                  )    Z
//                          WHERE Z.run_dt       <=  TO_DATE('${currentDate}','YYYYMMDD')        /* Current Day */
//                            AND Z.run_sys_dttm < '${currentDate}083003'                   /* Auto Debit Run System Date & Time */
//                    ) Z9
// 	    ) X
// WHERE   X.TO_REF_NO NOT IN (
//                             SELECT  REF_NO
// 							FROM    ACOM_ATB_BATCH
// 							WHERE   VAL_DT = TRUNC(SYSDATE)
// 							AND     TR_TYPE IN ('LN01', 'LN02', 'LN03')
//                         );`

// console.log(sql);

// function Anagrams(words){
//   const anagrams = {}
  
//   words.forEach(word=>{
//       const sorted = word.split('').sort().join('')
//       console.log(anagrams[sorted]);

//       if(!anagrams[sorted]){
//           anagrams[sorted]=[]
//       }
//       anagrams[sorted].push(word)
//   })
//   return Object.values(anagrams)
// }

// const words = ['kita','atik','tika','aku','kia','makan','kua']
// const result = Anagrams(words)
// console.log(result)

// const testObj = {};
// const testWord = 'Aku';
// // let testArr = [];

// console.log(testObj[testWord]);
// testObj[testWord] = [];
// testObj[testWord].push('1');

// console.log(testObj[testWord]);
// testArr.push

// let recipe = {flour: 500, sugar: 200, eggs: 1};
// let available = {flour: 1200, sugar: 1200, eggs: 5, milk: 200};

// function cakes(recipe, available) {
//   const recipes = Object.keys(recipe).map((val)=> val)
//   const stocks = Object.keys(available).map((val)=> val)
//   let arrRecipeable = [];
//   if(recipes.every((val)=>stocks.includes(val))){
//     recipes.forEach((rec)=> {
//       console.log(available[rec])
//       arrRecipeable.push(Math.floor(available[rec] / recipe[rec]))
//     })
//   }
//   console.log(arrRecipeable);
// }

// cakes(recipe,available)

// function countTrailingZeros(n) {
//   let count = 0;
//   let i = 5;
//   while (Math.floor(n / i) >= 1) {
//       count += Math.floor(n / i);
//       i *= 5;
//   }
//   return count;
// }

// // Example usage:
// let N = 10;
// console.log(`The number of trailing zeros in ${N}! is ${countTrailingZeros(N)}`);

// const numbers = [1,3,5,7,9];

// const out = numbers.reduce((output, num)=> {
//   return output+num
// })

// console.log(out)

// function generatePermutations(str) {
//     if (str.length <= 1) {
//       return [str];
//     }
  
//     let permutations = new Set();
    
//     for (let i = 0; i < str.length; i++) {
//       let char = str[i];
//       let remainingChars = str.slice(0, i) + str.slice(i + 1);
//     //   let remainingPermutations = generatePermutations(remainingChars);
      
//       for (let perm of remainingPermutations) {
//         permutations.add(char + perm);
//       }
//     }
    
//     return permutations;
//   }
  
//   // Example usage
//   let string = "aabb";
// generatePermutations(string);
  
//   console.log(generatePermutations(string))
  // Print all permutations
//   allPermutations.forEach(perm => console.log(perm));

// let str = "bc"
// console.log(str.slice(0, 1) + str.slice(1 + 1))

console.log("1"+"2")