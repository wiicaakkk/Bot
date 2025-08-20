// var changeDate = "";
const e = require('express');
const moment = require('moment')


const date = (changeDate, type, getInfo ) => {
const dateSch = moment(Date.now()).format('dddd DD').split(" ")
let arrDaily;
const day = moment(Date.now()).format("dddd");

const sunday = moment(Date.now()).startOf('week').format("YYYYMMDD");
const currentDate = moment(Date.now()).format("YYYYMMDD");

const prevDate = (moment(Date.now()).format("YYYYMMDD")-(day == "Monday" ? 3 : 1)).toString();
// const prevDate = "20230627"

const nextDate = moment(Date.now()).add((day == "Friday" ? 3 : 1), 'days').format("YYYY/MM/DD").toString();
// const nextDate = "2023/07/03"

const dateNow = moment(Date.now()).format("DD");
const endOfMonth = moment(Date.now()).endOf('month').format('DD');

const thisMonth = moment(Date.now()).format("YYYYMM");

var data = {day         : day,
  sunday      : sunday,
  currentDate : currentDate,
  prevDate    : prevDate,
  nextDate    : nextDate,
  dateNow     : dateNow,
  endOfMonth  : endOfMonth,
  thisMonth   : thisMonth
}

if(type == "check"){
  getInfo(data);
}

var autoDebit = `
SELECT COUNT(*) AS REMAIN
FROM   (
            SELECT Z9.*
              FROM (
                    SELECT Z.*
                      FROM (
                            SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
                                   DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
                                        AS run_sys_dttm
                                 , CASE WHEN B.ref_no IS     NULL THEN 'N'
                                        WHEN B.ref_no IS NOT NULL
                                         AND B.sts <> '0'         THEN 'Y'
                                        ELSE                           'P'
                                   END  AS run_flag
                                 , CASE WHEN A.due_type = 'D' THEN TO_DATE('${currentDate}','YYYYMMDD')   /* Current Day */
                                        WHEN A.due_type = 'W' THEN TO_DATE('${sunday}','YYYYMMDD') + A.due_day            /* Sunday Day */
                                        WHEN A.due_type = 'M' THEN CASE WHEN A.due_day > TO_NUMBER(${endOfMonth})                                   /* Current Last Day per Month */
                                                                        THEN TO_DATE('${thisMonth}' || '${endOfMonth}','YYYYMMDD')                          /* Current Year & Month / / Current Last Day per Month */
                                                                        ELSE TO_DATE('${thisMonth}' || '01'      ,'YYYYMMDD') + A.due_day - 1    /* Current Year & Month */
                                                                   END
                                        WHEN A.due_type = 'Y' THEN CASE WHEN TO_CHAR(A.opn_dt,'DD')
                                                                           > TO_CHAR(LAST_DAY(TO_DATE('2025'||TO_CHAR(A.opn_dt,'MM')||'01','YYYYMMDD')),'DD')                                  /* Current Year */
                                                                        THEN LAST_DAY(TO_DATE('2025'||TO_CHAR(A.opn_dt,'MM')||'01','YYYYMMDD'))                                  /* Current Year */
                                                                        ELSE TO_DATE('2025'||TO_CHAR(A.opn_dt,'MMDD'),'YYYYMMDD')                                  /* Current Year */
                                                                   END
                                   END  AS run_dt
                                 , A.*
                                 ,NVL(F.ACCT_NO,A.FR_ACCT_NO)                                                                                                                          AS ACCT_NO                                                                                   
                                 ,NVL(F.CUR_JAN,0)                                                                                                                                           AS DEPOSIT_AMT                                                    
                                 ,NVL(F.GIRO_PRK_YN,'Y')                                                                                                                                AS GIRO_PRK_YN
                              FROM acom_atb_base  A
                                 , acom_atb_batch B
                                 , acom_cix_base  C
                                 , acom_cont_base D
                                 , adst_lnb_base  E
                                 ,(SELECT A.*, CASE WHEN A.ACCT_NO = B.ACCT_NO THEN 'Y' ELSE 'N' END AS GIRO_PRK_YN 
                                                    FROM ADST_DPB_BASE 			  A,
                                                    	 ACOM_CONT_BASE			  C,
                                                    	 (SELECT * 
                                                    	 		FROM ADST_DPB_LNIF 
                                                    	 		WHERE STS = 0  )  B
                                                    WHERE A.ACCT_NO = B.ACCT_NO (+)
                                                    AND   A.ACCT_NO = C.REF_NO
                                                    AND   C.STS = 0
                                                    )  F 
                             WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
                               AND B.ref_no(+)     = A.ref_no
                               AND A.FR_ACCT_NO    = F.ACCT_NO(+)                                                                                                                                                                                          
                               AND B.val_dt(+)     = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
                               AND B.proc_type(+)  = 'FOTI'
                               AND A.sts           = '0'
                               AND A.tr_type      IN ('LN01','LN02','LN03')
                               AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')        /* Current Day */
                               AND A.exp_dt       >  TO_DATE('${prevDate}','YYYYMMDD')    /* Previous Day */
                               AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
                               AND (A.due_times    = 0
                                 OR A.due_times    > A.proc_times)
                               AND A.tr_type       = 'LN03'               /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
                               AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
                               AND A.to_ref_no     = D.ref_no
                               AND D.sts           = '0'
                               AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
                               AND D.ref_no        = E.ref_no
                               AND E.act_gb       != '3'
                               AND A.ref_no       <> '                    '             /* Previous Run Reference No */
                           ) Z
                     WHERE Z.run_dt      >  TO_DATE('${prevDate}','YYYYMMDD')    /* Previous Day */
                       AND Z.run_dt      <= TO_DATE('${currentDate}' ,'YYYYMMDD')      /* Current Day */
                       AND ((Z.run_flag   = 'N')
                         OR (Z.run_flag   = 'Y' AND Z.retry_yn = 'Y'))
                       AND Z.run_sys_dttm < '${currentDate}${changeDate? changeDate : "08"}3003'                   /* Auto Debit Run System Date & Time */
                    UNION
                    SELECT Z.*
                      FROM (
                            SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
                                   DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
                                        AS run_sys_dttm
                                 , CASE WHEN B.ref_no IS     NULL THEN 'N'
                                        WHEN B.ref_no IS NOT NULL
                                         AND B.sts <> '0'         THEN 'Y'
                                        ELSE                           'P'
                                   END  AS run_flag
                                 , CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
                                        WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
                                        WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
                                                                          WHEN E.nx_isu_il > E.nx_repay_il
                                                                                                   THEN E.nx_repay_il
                                                                          ELSE E.nx_isu_il
                                                                     END
                                   END  AS run_dt
                                 , A.*
                                 ,NVL(F.ACCT_NO,A.FR_ACCT_NO)                                                                                                                          AS ACCT_NO                                                                                   
                                 ,NVL(F.CUR_JAN,0)                                                                                                                                           AS DEPOSIT_AMT                                                    
                                 ,NVL(F.GIRO_PRK_YN,'Y')                                                                                                                                AS GIRO_PRK_YN
                              FROM acom_atb_base  A
                                 , acom_atb_batch B
                                 , acom_cix_base  C
                                 , acom_cont_base D
                                 , adst_lnb_base  E
                                 ,(SELECT A.*, CASE WHEN A.ACCT_NO = B.ACCT_NO THEN 'Y' ELSE 'N' END AS GIRO_PRK_YN 
                                                    FROM ADST_DPB_BASE 			  A,
                                                    	 ACOM_CONT_BASE			  C,
                                                    	 (SELECT * 
                                                    	 		FROM ADST_DPB_LNIF 
                                                    	 		WHERE STS = 0  )  B
                                                    WHERE A.ACCT_NO = B.ACCT_NO (+)
                                                    AND   A.ACCT_NO = C.REF_NO
                                                    AND   C.STS = 0
                                                    )  F
                             WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
                               AND A.FR_ACCT_NO    = F.ACCT_NO (+)                                                                                                                                                                                           
                               AND B.ref_no(+)     = A.ref_no
                               AND B.val_dt(+)     = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
                               AND B.proc_type(+)  = 'FOTI'
                               AND A.sts           = '0'
							                 AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
                               AND A.tr_type      IN ('LN01','LN02','LN03')
                               AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')     /* Current Day */
                               AND A.tr_type       = 'LN03'                    /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
                               AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
                               AND A.to_ref_no     = D.ref_no
                               AND D.sts           = '0'
                               AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
                               AND D.ref_no        = E.ref_no
                               AND E.act_gb       != '3'
                               AND A.ref_no       <> '                    '             /* Previous Run Reference No */
                           ) Z
                     WHERE Z.run_dt       <  TO_DATE('2025/04/08','YYYY/MM/DD')       /* Next Day Date */
                       AND ((Z.run_flag   = 'N')
                         OR (Z.run_flag   = 'Y' AND Z.retry_yn = 'Y'))
                       AND Z.run_sys_dttm < '${currentDate}${changeDate? changeDate : "08"}3003'                   /* Auto Debit Run System Date & Time */
                    UNION
                    SELECT Z.*
                      FROM (
                            SELECT DECODE(B.lst_ib_dt  , NULL, '00000000', TO_CHAR(B.lst_ib_dt,'YYYYMMDD')) ||
                                   DECODE(B.lst_ib_time, NULL, '000000'  , REPLACE(B.lst_ib_time,':',''  ))
                                        AS run_sys_dttm
                                 , 'Y'  AS run_flag
                                 , CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
                                        WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
                                        WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
                                                                          WHEN E.nx_isu_il > E.nx_repay_il
                                                                                                   THEN E.nx_repay_il
                                                                          ELSE E.nx_isu_il
                                                                     END
                                   END  AS run_dt
                                 ,  A.*
                                 ,NVL(G.ACCT_NO,A.FR_ACCT_NO)                                                                                                                          AS ACCT_NO                                                                                   
                                 ,NVL(G.CUR_JAN,0)                                                                                                                                           AS DEPOSIT_AMT                                                    
                                 ,NVL(G.GIRO_PRK_YN,'Y')                                                                                                                                AS GIRO_PRK_YN
                              FROM acom_atb_base  A
                                 , acom_atb_batch B
                                 , aact_trx_bal   C
                                 , adst_lnb_base  E
                                 ,
                                 ( SELECT  UNIQUE E.ref_no,
                                   CASE WHEN A.tr_type = 'LN01' THEN E.nx_repay_il
                                        WHEN A.tr_type = 'LN02' THEN E.nx_isu_il
                                        WHEN A.tr_type = 'LN03' THEN CASE WHEN E.nx_isu_il IS NULL THEN  E.nx_repay_il
                                                                          WHEN E.nx_isu_il > E.nx_repay_il
                                                                                                   THEN E.nx_repay_il
                                                                          ELSE E.nx_isu_il
                                                                     END
                                   END  AS run_dt
                              FROM acom_atb_base  A
                                 , acom_atb_batch B
                                 , acom_cix_base  C
                                 , acom_cont_base D
                                 , adst_lnb_base  E
                             WHERE DECODE(A.tr_type,'DP21',A.cix_no,A.fr_cix_no) = C.cix_no
                               AND B.ref_no        = A.ref_no
                               AND B.val_dt        = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
                               AND B.proc_type     = 'FOTI'
                               AND A.sts           = '0'
                               AND A.tr_type      IN ('LN01','LN02','LN03')
							                 AND A.MGNT_BR_NO LIKE '1108' || '%'                                /* 2022/11/07 - Leon [Add Branch Code]    */
                               AND A.opn_dt       <= TO_DATE('${prevDate}','YYYYMMDD')     /* Current Day */
                               AND A.exp_dt       >  TO_DATE('${currentDate}','YYYYMMDD')  /* Previous Day */
                               AND A.tr_type       = 'LN03'                                   /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
                               AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
                               AND A.to_ref_no     = D.ref_no
                               AND D.sts           = '0'
                               AND (D.dbt_aptc_yn NOT IN ('3', '4', '5') OR D.dbt_aptc_yn IS NULL) /* 2019/08/30 Kenny ~ Add Collectability 3 Cannot Process */
                               AND D.ref_no        = E.ref_no       ) F
                               ,(SELECT A.*, CASE WHEN A.ACCT_NO = B.ACCT_NO THEN 'Y' ELSE 'N' END AS GIRO_PRK_YN 
                                                    FROM ADST_DPB_BASE 			  A,
                                                    	 ACOM_CONT_BASE			  C,
                                                    	 (SELECT * 
                                                    	 		FROM ADST_DPB_LNIF 
                                                    	 		WHERE STS = 0  )  B
                                                    WHERE A.ACCT_NO = B.ACCT_NO (+)
                                                    AND   A.ACCT_NO = C.REF_NO
                                                    AND   C.STS = 0
                                                    )  G                                                                                                                                                                                                      
                           WHERE   A.FR_ACCT_NO    = G.ACCT_NO (+)
                             AND A.sts           = '0'
                             AND A.tr_type      IN ('LN01','LN02','LN03')
                             AND A.opn_dt       <= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
                             AND A.to_ref_no     = F.ref_no
                             AND F.run_dt       <= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
                             AND A.tr_type       = 'LN03'                                     /* LN01: Principal, LN02: Interest, LN03: Principal & Interest */
                             AND A.fr_acct_no LIKE '' || '%'       /* Account Deposit No */
                             AND E.ref_no        = F.ref_no
                             AND B.ref_no        = A.ref_no
                             AND B.val_dt        = TO_DATE('${currentDate}','YYYYMMDD')         /* Inquiry Day */
                             AND B.proc_type     = 'FOTI'
                             AND C.ref_no        = A.fr_acct_no
                             AND C.apcl_end_dt   = TO_DATE('99991231','YYMMDD')
                             AND C.bal_amt      != 0
                             AND C.dtls_bal_dv_cd IN ('D101','L202')
                             AND C.apcl_str_dt  >= TO_DATE('${currentDate}','YYYYMMDD')       /* Current Day */
                                 )    Z
                         WHERE Z.run_dt       <=  TO_DATE('${currentDate}','YYYYMMDD')        /* Current Day */
                           AND Z.run_sys_dttm < '${currentDate}${changeDate? changeDate : "08"}3003'                   /* Auto Debit Run System Date & Time */
                   ) Z9
                   WHERE   ((Z9.DEPOSIT_AMT > 0 AND Z9.GIRO_PRK_YN = 'N') OR (Z9.GIRO_PRK_YN = 'Y'))
                   )`;

var p2pRepay = `SELECT  AGT_CODE AS AGENT
,NO_BATCH                                  AS BAT
 ,CASE STS
   WHEN '0' THEN '[0]'
   WHEN '1' THEN '[1]'
   WHEN '2' THEN '[2]'
   WHEN '4' THEN '[4]'
   WHEN '8' THEN '[8]'
   WHEN '9' THEN '[9]'
   ELSE 'Live'
 END                                         AS STS
 ,CASE PROC_KIND
   WHEN '00' THEN '[00]'
   WHEN '01' THEN '[01]'
   WHEN '02' THEN '[02]'
   WHEN '21' THEN '[21]'
   WHEN '31' THEN '[31] PO - Int'
   WHEN '32' THEN '[32] PO - Pri'
   ELSE 'Unknown'
  END                                        AS PROC
 , COUNT(*)                                  AS REF
FROM    ADST_LNB_ACL_REPAY
WHERE   TRX_DT   = TO_CHAR( TRUNC(SYSDATE) ${changeDate}, 'YYYY/MM/DD' )
GROUP   BY STS, PROC_KIND, AGT_CODE, NO_BATCH
ORDER   BY AGT_CODE, NO_BATCH, STS, PROC_KIND`

var bfCount = `select count(1) as count from aact_trx_actlog_bf where trx_il = trunc(sysdate) ${changeDate}`;

var checkCloseBranch = `select a.br_no, to_char(a.open_il, 'YYYY/MM/DD') as open_il, a.bon_clsgb, a.CLS_BIT, b.enm 
                        from aact_acc_clsbr a, acom_bix_base b
                        where a.br_no = b.br_no
                        and tr_il = trunc(sysdate) ${changeDate} 
                        order by a.cls_bit desc`;

var afterCloseBranch = {
  name: "AFTER CLOSE EXPENSE VS BUDGET",
  query: `SELECT * FROM (
        SELECT T1.BUSI_CD,
               T1.MNG_BR,
               T1.ASSIGN_AMT + ADD_AMT - ADD_CAMT + PLUS_AMT - MINUS_AMT AS TOT_BUDGET,
               T2.DR_AMT - T2.CR_AMT AS TOT_EXPENSE,
               T1.TOTAL_AMT -
               (T1.ASSIGN_AMT + ADD_AMT - ADD_CAMT + PLUS_AMT - MINUS_AMT) +
               (T2.DR_AMT - T2.CR_AMT) AS DIFF
          FROM (SELECT *
                  FROM ACOM_EPB_BASE A
                 WHERE A.MNG_YY = '2022'
                   AND A.BUSI_CD IN (SELECT CODE
                                       FROM ACOM_COMH_CODE A
                                      WHERE A.TYPE = 'F162'
                                        AND A.CODE3 = '2')) T1,
               (SELECT B.ETC5 AS BUSI_CD,
                       A.MNG_BR,
                       SUM(A.DR_AMT) AS DR_AMT,
                       SUM(A.CR_AMT) AS CR_AMT
                  FROM ACOM_EPB_BASE A, ACOM_COMH_CODE B
                 WHERE A.MNG_YY = '2022'
                   AND B.TYPE = 'F162'
                   AND B.CODE3 = '3'
                   AND A.BUSI_CD = B.CODE
                 GROUP BY B.ETC5, A.MNG_BR) T2
         WHERE T1.MNG_BR = T2.MNG_BR
           AND T1.BUSI_CD = T2.BUSI_CD
         ORDER BY T1.BUSI_CD, T1.MNG_BR)
         WHERE MNG_BR NOT IN ('4101','1206','1107','1405') -- CABANG 4101 SUDAH TUTUP)
         AND DIFF <> 0`,
};

var closeAccountHavebalance = {
      name: "CLOSE ACC HAVE BALANCE TRX_BAL",
      query: `SELECT A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM, SUM(B.BAL_AMT)
    FROM ACOM_CONT_BASE A, AACT_TRX_BAL B, ACOM_COM_ACTCD C
    WHERE A.REF_NO = B.REF_NO
     AND A.STS = '9'
     AND C.BR_NO = '0000'
     AND C.BSPL_GB = 'B'
     AND B.ATIT_CD = C.AC_CD
     AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
     AND B.BAL_AMT <> 0
     AND (ATIT_CD NOT LIKE '815%' AND ATIT_CD NOT LIKE '915%') -- COA WO
    --AND B.ATIT_CD IN ('15422014', '15421014') COA AMORT RESTRU
    GROUP BY A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM
    ORDER BY REF_NO`,
    };

var giroPrkCancelCheck = {
  name: "Giro PRK Cancel Check",
  query: `      SELECT A.*                                                                                                      
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'C'                                                                    
           ELSE 'D'                                                                                         
            END ADJ_L_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'D'                                                                    
           ELSE 'C'                                                                                         
            END ADJ_D_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > D_BAL_AMT THEN D_BAL_AMT                                                      
           ELSE L_BAL_AMT                                                                                   
            END ADJUST_AMT                                                                                  
    , '0' AS IBF_GB                                                                                         
 FROM (SELECT REF_NO                                                                                        
            ,CCY                                                                                            
            ,BR_NO                                                                                          
            ,MAX(L_DTLS_BAL_DV_CD) L_DTLS_BAL_DV_CD                                                         
            ,MAX(D_DTLS_BAL_DV_CD) D_DTLS_BAL_DV_CD                                                         
            ,MAX(L_ATIT_CD) L_ATIT_CD                                                                       
            ,MAX(D_ATIT_CD) D_ATIT_CD                                                                       
            ,SUM(L_BAL_AMT) L_BAL_AMT                                                                       
            ,SUM(D_BAL_AMT) D_BAL_AMT                                                                       
         FROM (SELECT REF_NO                                                                                
                    , CCY                                                                                   
                    , BR_NO                                                                                 
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END L_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END D_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END L_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END D_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN BAL_AMT                               
                           ELSE 0                                                                           
                            END L_BAL_AMT                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN BAL_AMT                               
                            ELSE 0                                                                          
                             END D_BAL_AMT                                                                  
                 FROM AACT_TRX_BAL                                                                          
                WHERE REF_NO IN (SELECT REF_NO                                                              
                                   FROM AACT_TRX_BAL                                                        
                                  WHERE REF_NO IN (SELECT REF_NO                                            
                                                     FROM AACT_TRX_BAL                                      
                                                    WHERE trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT       
                                                      AND ATIT_CD = '21831001'                                 
                                                      AND BAL_AMT > 0                                          
                                                  )                                                            
                                    AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT         
                                    AND ATIT_CD = '15422011'                                                   
                                    AND (BAL_AMT > 0 OR BAL_AMT < 0)                                           
                                )                                                                              
                  AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT                           
                  AND ATIT_CD IN ('15422011', '21831001')                                                      
             )                                                                                                 
        GROUP BY REF_NO,CCY,BR_NO                                                                              
    ) A                                                                                                        
ORDER BY REF_NO`,
};

var GlBalanceCheck = {
  name: "GL Balance Check",
  query: `SELECT  X.*
  FROM    (
              -- BS & PL Balance
              ------------------
              SELECT  *
              FROM    (
                          SELECT  'BS'                              AS GB
                                  ,TR_IL                            
                                  ,BR_NO                            
                                  ,SUM(DR)                          AS DR
                                  ,SUM(CR)                          AS CR
                                  ,SUM(DR) - SUM(CR)                AS DIFFERENCE_AMT
                          FROM    (
                                      SELECT  TR_IL
                                              ,BR_NO
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) = '1' THEN AF_FJAN
                                                 ELSE 0
                                               END               AS DR
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3') THEN AF_FJAN
                                                 ELSE 0
                                               END               AS CR
                                      FROM    AACT_ACT_DATE
                                      WHERE   TR_IL = TRUNC(SYSDATE) ${changeDate}
                                      AND     SUBSTR(AC_CD, 1, 1) IN ('1', '2', '3')
                                  )
                          GROUP   BY TR_IL, BR_NO
                          UNION   ALL
                          SELECT  'PL'                AS GB
                                  ,TR_IL
                                  ,BR_NO
                                  ,SUM(DR)
                                  ,SUM(CR)
                                  ,(SUM(DR) - SUM(CR)) + SUM(DIFF)  AS DIFFERENCE_AMT
                          FROM    (
                                      SELECT  TR_IL
                                              ,BR_NO
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) IN ('5') THEN AF_FJAN --?? / DR
                                                 ELSE 0
                                               END    AS DR
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) IN ('4') THEN AF_FJAN --?? / ?? / CR
                                                 ELSE 0
                                               END    AS CR
                                              ,CASE
                                                 WHEN AC_CD = '33101001' THEN AF_FJAN
                                                 ELSE 0
                                               END    AS DIFF
                                      FROM    AACT_ACT_DATE
                                      WHERE   TR_IL = TRUNC(SYSDATE) ${changeDate}
                                  )
                          GROUP   BY TR_IL, BR_NO
                          UNION   ALL
                          SELECT  'BS/PL' AS GB
                                  ,TR_IL
                                  ,BR_NO
                                  ,SUM(DR)
                                  ,SUM(CR)
                                  ,SUM(DR) - SUM(CR)               AS DIFFERENCE_AMT
                          FROM    (
                                      SELECT  TR_IL
                                              ,BR_NO
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) IN ('1', '5') THEN AF_FJAN --?? / DR
                                                 ELSE 0
                                               END         AS DR
                                              ,CASE
                                                 WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3', '4') THEN AF_FJAN --?? / ?? / CR
                                                 ELSE 0
                                               END         AS CR
                                      FROM    AACT_ACT_DATE
                                      WHERE   TR_IL  = TRUNC(SYSDATE) ${changeDate}
                                      AND     AC_CD != '33101001'
                                  )
                          GROUP   BY TR_IL, BR_NO
                      )
              --ORDER BY GB, TR_IL, BR_NO 
              UNION   ALL
              -- Reconcile Balance
              --------------------
              SELECT  'AFEX_RCH_BAL'
                      ,T1.TR_IL
                      ,T1.CD
                      ,T1.SHW_OPBS - NVL(T2.AMT, 0)
                      ,T1.SHW_CLBS
                      ,(T1.SHW_OPBS - NVL(T2.AMT, 0)) - T1.SHW_CLBS AS DIFFERENCE_AMT
              FROM    AFEX_RCH_BAL T1
              LEFT    OUTER JOIN (
                                     SELECT  CD
                                             ,SUM(
                                                     CASE
                                                      WHEN DRCR_GB = 'D' THEN DRCR_AMT * -1
                                                      WHEN DRCR_GB = 'C' THEN DRCR_AMT
                                                     END
                                                 )                  AS AMT
                                     FROM    AFEX_RCH_PEND
                                     WHERE   TR_IL = TRUNC(SYSDATE) ${changeDate}
                                     AND     SA_GB = 'S'
                                     GROUP   BY CD
                                 ) T2 ON T1.CD = T2.CD
              WHERE   T1.TR_IL = TRUNC(SYSDATE) ${changeDate}
              --AND     T1.CD   < 2011
              UNION   ALL
              -- Wash (28911001) & CCA (28911002)
              -----------------------------------
              SELECT  'WASH'
                      ,A.TR_IL
                      ,A.BR_NO
                      ,NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, 0)), 0) AS DR
                      ,NVL(SUM(DECODE(B.BLDRCR_GB, 'C', A.AF_FJAN, 0)), 0) AS CR
                      ,NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, -A.AF_FJAN)), 0) AS DIFFERENCE_AMT
              FROM    AACT_ACT_DATE    A
                      , ACOM_COM_ACTCD B
              WHERE   A.BSPL_GB = 'B'
              AND     A.TR_IL   = TRUNC(SYSDATE) ${changeDate}
              AND     A.BSPL_GB = B.BSPL_GB
              AND     A.AC_CD   = B.AC_CD
              AND     A.AC_CD   IN ('28911001', '28911002')
              AND     B.BR_NO   = '0000'
              AND     B.AC_KD NOT IN ('6', '7', '8', '9')
              GROUP   BY A.BR_NO, A.TR_IL
              UNION   ALL
              -- ATM Cash (10104001)
              ----------------------
              SELECT  'ATM Cash'
                      , A.*
                      , A.ATM_DT_BAL - A.ACT_DT_BAL  AS DIFFERENCE_AMT
              FROM    (
                          SELECT  A.TR_DT
                                  ,A.BR_NO
                                  ,SUM(A.AF_BAL)     AS ATM_DT_BAL
                                  ,B.AF_FJAN         AS ACT_DT_BAL
                          FROM    AACT_ATM_DATE      A
                          INNER   JOIN AACT_ACT_DATE B ON A.AC_CD = B.AC_CD
                          AND     A.BR_NO = B.BR_NO
                          AND     A.TR_DT = B.TR_IL
                          WHERE   1       = 1
                          GROUP   BY A.TR_DT, A.BR_NO, B.AF_FJAN 
                      ) A
              WHERE   A.TR_DT = TRUNC(SYSDATE) ${changeDate}
        )   X
  WHERE   X.DIFFERENCE_AMT <> 0`,
};

var GlBalanceVsTrxBal = {
  name: "GL Balance VS TRX Bal",
  query: `SELECT B.*, A.*
  FROM ACOM_COM_ACTCD A, --TABEL COA
       (SELECT BR_NO,
               COA_CD,
               CCY,
               SUM(TRX_AMT) AS TRX_AMT,
               SUM(ACT_AMT) AS ACT_AMT,
               SUM(TRX_AMT) - SUM(ACT_AMT) AS DIFF_AMT
          FROM (SELECT BR_NO,
                       ATIT_CD AS COA_CD,
                       CCY,
                       SUM(BAL_AMT) AS TRX_AMT,
                       0 AS ACT_AMT
                  FROM AACT_TRX_BAL --TABEL TRANSAKSI BALANCE
                 WHERE BAL_AMT != 0
                      --AND     ATIT_CD   = '18304101'
                      --AND     BR_NO     = '1201'
                   AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
                 GROUP BY BR_NO, ATIT_CD, CCY
                UNION ALL
                SELECT BR_NO, AC_CD, CCY, 0, SUM(AF_FJAN) AS ACT_AMT
                  FROM AACT_ACT_DATE --TABEL GENERAL LEDGER
                 WHERE TR_IL = trunc(sysdate) ${changeDate}
                      --AND     AC_CD = '18304101'
                   AND AF_BJAN != 0
                 GROUP BY BR_NO, AC_CD, CCY)
         GROUP BY BR_NO, COA_CD, CCY
        HAVING SUM(TRX_AMT) - SUM(ACT_AMT) != 0) B
 WHERE A.BR_NO = '0000'
   AND A.AC_CD = B.COA_CD
   AND A.AC_KD IN ('1', '2', '3', '6', '7', '8', '9')
   AND A.AC_CD NOT IN ('10101001' -- Cash in Vault
                      ,'10102001' -- Petty Cash
                      ,'10104001' -- ATM Cash
                      ,'10401001' -- Demand Deposit at Bank Indonesia
		      ,'10401002' -- Demand Deposit at Bank Indonesia BI FAST
                      ,'10421001' -- Demand Deposit at Domestic Banks
                      ,'18302101' -- Suspence Receivable ATM
		      ,'18308101' -- Suspence Receivable ATM
                      ,'18809001' -- Inter Office Account
                      ,'28809001' -- Inter Office A/C (Settlement)
                      ,'19959002' -- ARTAJASA Receivable
                      ,'19959003' -- ALTO Receivable
                      ,'28936001' -- Liability to Indosat Due to Overbooking Transaction
                      ,'28937001' -- Liability to XL Due to Overbooking Transaction
                      ,'28938001' -- Liability to Smartfen Due to Overbooking Transaction
                      ,'28941001' -- Liability to ARTAJASA 
                      ,'28942001' -- Liability to ATM Fee
                      ,'28943001' -- Liability to  Join Debit Due to Overbooking Transaction
                      ,'33001001' -- Previous Years Accumulated Profit/Loss
                      ,'33101001' -- Current Year Profit/Loss
                      ,'28090001'
											,'28911001'
											,'80000002'
											,'90000002'
											,'28944001'
											,'28940001'
											,'20040002')
 ORDER BY B.COA_CD, B.BR_NO, B.CCY` ,
};

var liabiltyMinusCheck = {
  name: "Liability Minus Check",
  query: `SELECT A.TR_IL, A.BR_NO, B.ENM AS COA_NM, A.AC_CD AS COA, A.AF_FJAN, A.CCY, '' AS REF_NO
    FROM AACT_ACT_DATE A, ACOM_COM_ACTCD B --TABEL GL DAN COA 
   WHERE A.AC_CD = B.AC_CD
     AND A.TR_IL = trunc(sysdate) ${changeDate}
     AND A.AC_CD LIKE '2%' --COA LIAB
     AND A.AC_CD <> '28991501' --COA CKPN NOT INCLUDE
     AND A.AF_FJAN < 0
  UNION ALL
  SELECT C.APCL_STR_DT, C.BR_NO, D.ENM AS COA_NM, C.ATIT_CD AS COA, C.BAL_AMT, C.CCY, C.REF_NO
    FROM AACT_TRX_BAL C, ACOM_COM_ACTCD D --TABEL TRANSAKSI BALANCE DAN COA 
   WHERE C.ATIT_CD = D.AC_CD
     AND C.ATIT_CD LIKE '2%'
     AND C.ATIT_CD <> '28991501' --COA CKPN NOT INCLUDE
     AND TRUNC(SYSDATE)${changeDate? "-2" : "-1"} BETWEEN APCL_STR_DT AND APCL_END_DT
     AND C.BAL_AMT < 0
     AND C.REF_NO NOT LIKE 'DJN%'
     --and C.APCL_STR_DT > TO_DATE('18072019', 'DDMMYYYY')`,
};

var loanBaseNSwithLoanSch = {
  name: "Loan Base With Loan Schedule",
  query: `SELECT *
    FROM (SELECT T1.*,
                 T2.PLAN_AMT AS SCH_PLAN_AMT,
                 T1.LON_JAN - (T2.PLAN_AMT - T2.PAY_AMT) AS DIFF --TOTAL PINJAMAN - TOTAL PINJAMAN DI SCHEDULE
            FROM (SELECT A.REF_NO, A.LON_JAN
                    FROM ADST_LNB_BASE A, ACOM_CONT_BASE B --TABEL LOAN BASE AND ACCOUNT FASILTAS
                   WHERE A.REF_NO = B.REF_NO
                     AND B.STS = '0') T1,
                 (SELECT A.REF_NO,
                         SUM(PLAN_AMT) AS PLAN_AMT,
                         SUM(PAY_AMT) AS PAY_AMT
                    FROM ADST_LNB_SCH A -- TABEL LOAN SCHEDULE
                   WHERE A.REF_NO IN (SELECT B.REF_NO
                                        FROM ACOM_CONT_BASE B
                                       WHERE B.STS = '0')
                     AND A.SCH_GB = '001'
                     AND STS = '0'
                     AND A.ADJ_SEQ = 0
                   GROUP BY REF_NO) T2
           WHERE T1.REF_NO = T2.REF_NO
             AND T1.LON_JAN <> T2.PLAN_AMT) TT1
   WHERE (TT1.DIFF < -1 OR TT1.DIFF > 1)`,
};

var loanBatchPaymentProcess = {
  name: "Loan Batch Payment Process",
  query: `SELECT  *
    FROM    ACOM_ATB_BATCH
    WHERE   VAL_DT    = trunc(sysdate) ${changeDate}
    AND     TR_TYPE   LIKE 'LN%'
    AND     ERR_MSG   IS NULL`,
};

var allocationCollateral = {
  name: "Allocation Collateral",
  query: `
SELECT  *
FROM    ACOM_BAT_PROCLST
WHERE   PROC_BRNO = '0888'
AND     PROC_DT   = trunc(sysdate)${changeDate? "-2" : "-1"}
AND     JOB_ID    LIKE 'dmb%'
AND     SEQ_NO    = 0
AND     PROC_STS  <> 2
`,
};

var otBatchCheck = {
  name: "OT Batch Check",
  query: `SELECT a.proc_dt,
    a.bat_pgm_id,
    a.proc_brno,
    proc_sts,
    str_tm,
    end_tm,
    (substr(end_tm, 0, 2) * 60 + substr(end_tm, 4, 2) +
    substr(end_tm, 7, 2) / 60) -
    (substr(str_tm, 0, 2) * 60 + substr(str_tm, 4, 2) +
    substr(str_tm, 7, 2) / 60) as execution_time
FROM ACOM_BAT_PROCLST A
WHERE A.PROC_DT = trunc(sysdate) ${changeDate}
AND A.BAT_PGM_ID LIKE 'OT%'
AND PROC_STS <> 2
order by str_tm`,
};

var wrongAmort = {
  name: "Wrong Amortization",
  query: `select *
    from IFRS_DD_BY_CFLW_DPRC_PTCL a
   where (BASC_DT, IFRS_ACCT_MGNT_NO, DPRC_DT) in
         (select BASC_DT, IFRS_ACCT_MGNT_NO, max(DPRC_DT) DPRC_DT
            from IFRS_DD_BY_CFLW_DPRC_PTCL z
           WHERE z.ifrs_acct_mgnt_no not like 'DAG%'
             and z.comm_cd not like '9999%'
           group by BASC_DT, IFRS_ACCT_MGNT_NO
          )
     and DPRC_TGT_AMT < 0
     and a.comm_cd not like '99999%'
   order by BASC_DT desc, IFRS_ACCT_MGNT_NO`,
};

var checkBatchJobMonday = {
  name: "Batch Job For Monday",
  query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
CASE 
WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
CASE 
WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
( 
SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= trunc(sysdate) ${changeDate? "-4" : "-3"} AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
) C
WHERE PROC_STS = '9' --STATUS ERROR
AND NOT 
(RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
ORDER BY C.PROC_DT, C.STR_TM`,
};

var checkBatchJobTuesdayFriday = {
  name: "Batch Job Tueday - Friday ",
  query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
    CASE 
    WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
    WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
    CASE 
    WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
    (
    SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= trunc(sysdate) ${changeDate} AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
    ) C
    WHERE PROC_STS = '9' --STATUS ERROR
    AND NOT 
    (RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
    OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
    OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
    OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
    ORDER BY C.PROC_DT, C.STR_TM`,
};

var checkBatchJobFirstDay = {
  name: "Batch Job For 1st Day",
  query: `select mng_br as branch_no,
    count(mng_br) as exec_contract,
    case
      when count(mng_br) > 0 then
       'SUCCESS'
      else
       'PLEASE CHECK'
    end as REMARK
from acom_atb_batch
where val_dt = LAST_DAY(ADD_MONTHS(trunc(sysdate) ${changeDate}, -1)) + 1
and tr_type like 'DP32%'
group by mng_br
order by mng_br asc`,
};

var accrualHaveNormalAccrualBal = {
  name: "NPL ACCRUAL HAVE NORMAL ACCRUAL BALANCE",
  query: `SELECT /*+PARALLEL(XX 16)+*/
    XX.*
     FROM (SELECT Z.REF_NO,
                  X.BIZ_GB,
                  Z.BAL_AMT AS TRX_BAL,
                  X.ACR_TOT,
                  Z.BAL_AMT - X.ACR_TOT AS DIFF
             FROM (SELECT REF_NO, SUM(BAL_AMT) AS BAL_AMT
                     FROM AACT_TRX_BAL A
                    WHERE A.REF_NO IN (SELECT REF_NO
                                         FROM AACT_ACR_BASE XX
                                        WHERE XX.ACR_KD = '3'
                                          AND XX.ACR_GB <> 'N'
                                          AND XX.SEQ_NO = 0
                                          AND STS = '0'
                                          )
                      AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                     AND A.ATIT_CD IN ('19101001','19101002','19101004') --COA LOAN 19101001, COA FB 19101002 19101004
                      AND DTLS_BAL_DV_CD = 'F309'
                                       --AND A.REF_NO = 'DFB0888221000002'
                                        GROUP BY REF_NO) Z,
                  (SELECT /*+ index(B AACT_ACR_BAL_PK) */B.REF_NO, SUM(B.ACR_TOT) AS ACR_TOT, C.BIZ_GB
                     FROM AACT_ACR_BAL B, AACT_ACR_BASE C
                    WHERE B.REF_NO = C.REF_NO
                      AND B.REF_NO IN (SELECT REF_NO
                                         FROM AACT_ACR_BASE XX
                                        WHERE XX.ACR_KD = '3'
                                          AND XX.ACR_GB <> 'N'
                                          AND XX.SEQ_NO = 0
                                          AND STS = '0')
                      AND C.BIZ_SEQ = B.BIZ_SEQ
                      AND C.BIZ_SUBSEQ = B.BIZ_SUBSEQ
                      AND C.AC_CD = B.AC_CD
                      AND C.SEQ_NO = 0
                      AND C.STS = '0'
                      AND C.ACR_KD = '3'
                      AND C.ACR_GB <> 'N'
                      AND C.REMARK NOT LIKE '%MIG%'
                    GROUP BY B.REF_NO, C.BIZ_GB) X
            WHERE Z.REF_NO = X.REF_NO) XX
    WHERE XX.DIFF <> 0`,
};

var accrualHaveNplAcrrualBal = {
  name: "NORMAL ACCRUAL HAVE NPL ACCRUAL BALANCE",
  query: `SELECT /*+PARALLEL(XX 16)*/
    XX.*
     FROM (SELECT Z.REF_NO,
                  X.BIZ_GB,
                  Z.BAL_AMT AS TRX_BAL,
                  X.ACR_TOT,
                  Z.BAL_AMT - X.ACR_TOT AS DIFF
             FROM (SELECT REF_NO, BAL_AMT
                     FROM AACT_TRX_BAL A
                    WHERE A.REF_NO IN (SELECT REF_NO
                                         FROM AACT_ACR_BASE XX
                                        WHERE XX.ACR_KD = '3'
                                          AND XX.ACR_GB = 'N'
                                          AND XX.SEQ_NO = 0
                                          AND STS = '0')
                      AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                      AND A.ATIT_CD = '81003001'
                      AND DTLS_BAL_DV_CD = 'F841') Z,
                  (SELECT B.REF_NO, SUM(B.ACR_TOT) AS ACR_TOT, C.BIZ_GB
                     FROM AACT_ACR_BAL B, AACT_ACR_BASE C
                    WHERE B.REF_NO = C.REF_NO
                      AND B.REF_NO IN (SELECT REF_NO
                                         FROM AACT_ACR_BASE XX
                                        WHERE XX.ACR_KD = '3'
                                          AND XX.ACR_GB = 'N'
                                          AND XX.SEQ_NO = 0
                                          AND STS = '0')
                      AND C.BIZ_SEQ = B.BIZ_SEQ
                      AND C.BIZ_SUBSEQ = B.BIZ_SUBSEQ
                      AND C.AC_CD = B.AC_CD
                      AND C.SEQ_NO = 0
                      AND C.STS = '0'
                      AND C.ACR_KD = '3'
                      AND C.ACR_GB = 'N'
                      AND C.REMARK NOT LIKE '%MIG%'
                    GROUP BY B.REF_NO, C.BIZ_GB) X
            WHERE Z.REF_NO = X.REF_NO) XX
    WHERE XX.DIFF <> 0`,
};

var nplAcrualAndNormalAccrualBal = {
  name: "NPL ACCRUAL & NORMAL ACCRUAL BALANCE",
  query: `SELECT * /*+PARALLEL(T1 8) (T2 8)*/
    FROM (SELECT REF_NO AS REF_NO_OFF, BAL_AMT AS BAL_AMT_OFF
            FROM AACT_TRX_BAL A
           WHERE A.REF_NO IN (SELECT REF_NO
                                FROM AACT_ACR_BASE XX
                               WHERE XX.ACR_KD = '3'
                                    --AND XX.ACR_GB = 'N'
                                 AND XX.SEQ_NO = 0
                              --AND STS = '0'
                              )
             AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
             AND A.ATIT_CD = '81003001'
             AND DTLS_BAL_DV_CD = 'F841'
             AND BAL_AMT <> 0) T1,
         (SELECT REF_NO AS REF_NO_ON, BAL_AMT AS BAL_AMT_ON
            FROM AACT_TRX_BAL A
           WHERE A.REF_NO IN (SELECT REF_NO
                                FROM AACT_ACR_BASE XX
                               WHERE XX.ACR_KD = '3'
                                    --AND XX.ACR_GB = 'N'
                                 AND XX.SEQ_NO = 0
                              --AND STS = '0'
                              )
             AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
             AND A.ATIT_CD = '19101001'
             AND DTLS_BAL_DV_CD = 'F309'
             AND BAL_AMT <> 0) T2
   WHERE T1.REF_NO_OFF = T2.REF_NO_ON`,
};

var nplHaveNormalAccrualOrNonNplHaveNplAccrual = {
  name: "NPL HAVE NORMAL ACR OR NON NPL HAVE NPL ACR",
  query: `SELECT /*+ FULL(A) PARALLEL(A 12)(B 8)(C 8)*/
  A.REF_NO, C.ATIT_CD, C.BAL_AMT, A.DBT_APTC_YN, C.DTLS_BAL_DV_CD, C.BR_NO, B.AC_CD, 'NPL HAVE NORMAL ACCRUAL' AS REMARK
FROM (SELECT /*+ MATERIALIZE */ AA.*
   FROM ACOM_CONT_BASE AA
  WHERE AA.DBT_APTC_YN IN ('3', '4', '5')
    AND AA.REF_NO NOT LIKE 'DAG%'
    AND AA.REF_NO NOT LIKE 'DWO%'
    AND AA.REF_NO NOT LIKE 'DAY%'
    AND AA.STS = '0') A,
(SELECT A.*
   FROM AACT_ACR_BASE A
  WHERE A.SEQ_NO = '0'
    AND A.STS = '0'
    AND A.ACRFM_IL <= TRUNC(SYSDATE) ${changeDate}
    AND A.ACR_KD = '3') B,
AACT_TRX_BAL C
WHERE A.REF_NO = B.REF_NO
AND A.REF_NO = C.REF_NO
AND B.ACRSD_AC = C.ATIT_CD
AND A.MGNT_BR_NO = C.BR_NO
AND C.CCY = 'IDR'
AND TRUNC(SYSDATE) ${changeDate} BETWEEN C.APCL_STR_DT AND C.APCL_END_DT
AND C.BAL_AMT <> 0
UNION ALL
SELECT /*+ FULL(A) PARALLEL(A 12)(B 8)(C 8)*/
  A.REF_NO, C.ATIT_CD, C.BAL_AMT, A.DBT_APTC_YN, C.DTLS_BAL_DV_CD, C.BR_NO, B.AC_CD, 'NON-NPL HAVE NPL ACCRUAL' AS REMARK
FROM (SELECT /*+ MATERIALIZE */ AA.*
   FROM ACOM_CONT_BASE AA
  WHERE AA.DBT_APTC_YN NOT IN ('3', '4', '5')
    AND AA.REF_NO NOT LIKE 'DAG%'
    AND AA.REF_NO NOT LIKE 'DWO%'
    AND AA.REF_NO NOT LIKE 'DAY%'
    AND AA.STS = '0') A,
(SELECT A.*
   FROM AACT_ACR_BASE A 
  WHERE A.SEQ_NO = '0'
    AND A.STS = '0'
    AND A.ACRFM_IL <= TRUNC(SYSDATE) ${changeDate}
    AND A.ACR_KD = '3') B,
AACT_TRX_BAL C
WHERE A.REF_NO = B.REF_NO
AND A.REF_NO = C.REF_NO
AND C.ATIT_CD IN
 (SELECT A.ETC1 FROM ACOM_COMH_CODE A WHERE A.TYPE = 'F1250')
AND A.MGNT_BR_NO = C.BR_NO
AND C.CCY = 'IDR'
AND TRUNC(SYSDATE) ${changeDate} BETWEEN C.APCL_STR_DT AND C.APCL_END_DT
AND C.BAL_AMT <> 0`,
};

var transactionBackdate = {
  name: "TRX BACKDATE IN LAST 7 DAYS",
  query: `SELECT A.REF_NO, A.HIS_NO, A.TRX_BR, A.UPMU_CD || GEOR_CD AS MENU, TO_CHAR(A.TRX_IL, 'YYYY-MM-DD') AS TRX_IL , TO_CHAR(A.AC_IL, 'YYYY-MM-DD') AS AC_IL , TO_CHAR(A.IB_IL) AS IB_IL , TO_CHAR(A.GIS_IL) AS GIS_IL, A.CAN_IL /*+ PARALLEL(A, 16)*/
  FROM AACT_TRX_BASE A
 WHERE A.TRX_IL >= TRUNC(SYSDATE - 7)
   AND (REF_NO NOT LIKE 'DBT%' AND REF_NO NOT LIKE 'ACR%')
   AND (A.TRX_IL > A.AC_IL OR
       (A.AC_IL <> A.IB_IL OR A.AC_IL <> A.GIS_IL OR A.AC_IL < A.CAN_IL))`,
};
var checkDwi = `select cd, start_tm, end_tm, remark from acom_reh_his where base_dt = trunc(sysdate) ${changeDate} and cd IN ('CM603','CM701','CM301')`;
var checkCD = `SELECT * FROM (
  SELECT DISTINCT OPEN_IL AS "TODAY"
  FROM AACT_ACC_CLSBR 
  ORDER BY OPEN_IL DESC
  )
  WHERE ROWNUM = 1
  `
var acrP2PRemain = `SELECT  CODE1       AS TRX_DATE
,CODE4      AS BRANCH_NO
,CODE2      AS BATCH_NO
,CASE ETC2
  WHEN '0' THEN '[0] Not Complete'
  WHEN '4' THEN '[4] Error'
  WHEN '9' THEN '[9] Complete'
  ELSE '[] Unknown'
 END        AS STATUS
,COUNT(*)   AS TOTAL
FROM    ACOM_COMH_CODE
WHERE   TYPE  = 'F1251'
AND     CODE  = 'ACR_P2P'
AND     CODE1 = TO_CHAR(TRUNC(SYSDATE) ${changeDate}, 'YYYY/MM/DD')
GROUP   BY CODE1, CODE4, CODE2, ETC2
ORDER   BY CODE1, CODE4, TO_NUMBER(CODE2), ETC2 ASC`

var acrRLRemain = `SELECT  CODE1       AS TRX_DATE
,CODE4      AS BRANCH_NO
,CODE2      AS BATCH_NO
,CASE ETC2
  WHEN '0' THEN '[0] Not Complete'
  WHEN '4' THEN '[4] Error'
  WHEN '9' THEN '[9] Complete'
  ELSE '[] Unknown'
 END        AS STATUS
,COUNT(*)   AS TOTAL
FROM    ACOM_COMH_CODE
WHERE   TYPE  = 'F1251'
AND     CODE  = 'ACR_RETAIL'
AND     CODE1 = TO_CHAR(TRUNC(SYSDATE) ${changeDate}, 'YYYY/MM/DD')
GROUP   BY CODE1, CODE4, CODE2, ETC2
ORDER   BY CODE1, CODE4, TO_NUMBER(CODE2), ETC2 ASC`

var p2pAcr = `SELECT PROC_DT, SUBSTR(JOB_ID, 11, 2) AS NO_BATCH , PROC_TYPE, SEQ_NO, PROC_STS, RTN_MSG, BAT_PGM_ID 
FROM ACOM_BAT_PROCLST 
WHERE BAT_PGM_ID LIKE 'OT%' 
AND BAT_PGM_ID NOT IN ('OTB7000') 
AND PROC_DT = TRUNC(SYSDATE) ${changeDate}
AND SEQ_NO = 0
AND PROC_BRNO = '1109'
ORDER BY NO_BATCH`

var p2pAcr1108 = `SELECT PROC_DT, SUBSTR(JOB_ID, 11, 2) AS NO_BATCH , PROC_TYPE, SEQ_NO, PROC_STS, RTN_MSG, BAT_PGM_ID 
FROM ACOM_BAT_PROCLST 
WHERE BAT_PGM_ID LIKE 'OT%' 
AND BAT_PGM_ID NOT IN ('OTB7000') 
AND PROC_DT = TRUNC(SYSDATE) ${changeDate}
AND SEQ_NO = 0
AND PROC_BRNO = '1108'
ORDER BY NO_BATCH`

var acrTime = `SELECT  PROC_BRNO, PROC_DT, BAT_PGM_ID AS PGM, STR_TM, END_TM , ROUND((SUBSTR(END_TM, 0, 2) * 60 + SUBSTR(END_TM, 4, 2) + SUBSTR(END_TM, 7, 2) / 60) - (SUBSTR(STR_TM, 0, 2) * 60 + SUBSTR(STR_TM, 4, 2) + SUBSTR(STR_TM, 7, 2) / 60),2) AS EXECUTION_TIME_MINUTE FROM ACOM_BAT_PROCLST WHERE PROC_DT = TRUNC(SYSDATE) ${changeDate} AND     BAT_PGM_ID LIKE 'OT6203_%' ORDER   BY STR_TM, JOB_ID ASC`

var batAcrP2p = `SELECT '/app/tmax//batchbin/otb6203_p2p ' || 'Y ' || JOB_ID || ' ' || 'OT6203_P2P 02 1109 ' ||
TO_CHAR(PROC_DT, 'YYYY/MM/DD') ||
' ' || REG_EMP_NO || ' 2 N Y N '|| '999999999999999' || ' ' 
|| '99 ' || (CASE WHEN SUBSTR(SUBSTR(JOB_ID,11,2),1,1) = '0' THEN SUBSTR(JOB_ID,12,1) ELSE SUBSTR(JOB_ID,11,2) END) ||' >> /inoan/log/batlog/OTB6203_P2P_1109_' ||
TO_CHAR(PROC_DT, 'YYYYMMDD') || '_' ||  ((CASE WHEN SUBSTR(SUBSTR(JOB_ID,11,2),1,1) = '0' THEN SUBSTR(JOB_ID,12,1) ELSE SUBSTR(JOB_ID,11,2) END)) || '.log' AS Shellscript FROM
(SELECT DISTINCT PROC_DT, JOB_ID, REG_EMP_NO FROM acom_bat_proclst A
WHERE 1 = 1
AND A.PROC_DT = trunc(sysdate) ${changeDate}
AND A.BAT_PGM_ID = 'OT6203_P2P' 
AND A.PROC_STS = '9'
AND A.SEQ_NO = 0)`

var bulkTemp = `SELECT TO_CHAR(REG_DT,'YYYY/MM/DD') AS REG_DT, STS, COUNT(*) AS COUNT FROM ACOM_BULK_TEMP 
WHERE REG_DT >= TO_DATE('20230708','YYYYMMDD')
GROUP BY STS, REG_DT
ORDER BY REG_DT`

var Acr1108 = `SELECT /*+LEADING(A C) FULL(A) FULL(C) PARALLEL(A 4) PARALLEL(C 12) */ COUNT(*)
FROM 
(
    SELECT /*+  full(a) PARALLEL (A 12)*/
           *
      FROM AACT_ACR_BASE A        
     WHERE
         A.AC_CD   = '41821001'
     AND A.FEE_CD  = '051'
     AND A.SEQ_NO  = '0'
     AND A.STS     = '0'
     AND A.BR_NO   = '1108'
     AND A.UPMU_CD = 'LN'
     AND A.ACRFM_IL<= TRUNC(SYSDATE)
     AND A.ACR_AMT > 1
     AND NOT EXISTS (
                   SELECT /*+ HASH_SJ */
                      1
                     FROM AACT_ACR_HIS X
                    WHERE     A.REF_NO     = X.REL_REFNO
                          AND A.AC_CD      = X.AC_CD
                          AND A.FEE_CD     = X.FEE_CD
                          AND A.BIZ_SEQ    = X.BIZ_SEQ
                          AND A.BIZ_SUBSEQ = X.BIZ_SUBSEQ
                          AND A.BIZ_GB     = X.BIZ_GB
                          AND X.AC_IL      = TRUNC(SYSDATE)
                     )  
) A,
ACOM_CONT_BASE C
WHERE 
     C.MGNT_BR_NO = '1108'                                                   
 AND C.PRD_CD     NOT IN ('030302101002')                                         
 AND C.STS        = '0'
 AND C.SUBJ_CD    = 'LN' 
 AND A.REF_NO     = C.REF_NO`

var unused0 = `SELECT TO_CHAR(PROC_BASE_DT,'YYYY/MM/DD') AS PROC_BASE_DT, COUNT(*) AS COUNT, STS FROM AACT_TRX_BATCHACT WHERE PROC_BASE_DT = TRUNC(SYSDATE)${changeDate} GROUP BY PROC_BASE_DT, STS`

var unused9 = `SELECT TO_CHAR(PROC_BASE_DT,'YYYY/MM/DD') AS PROC_BASE_DT, GRP_KEY AS GRP, STS FROM AACT_TRX_BATCHACT WHERE STS = '9' AND PROC_BASE_DT = TRUNC(SYSDATE)${changeDate}`

  arrDaily = [
    afterCloseBranch,
    allocationCollateral,
    accrualHaveNormalAccrualBal,
    accrualHaveNplAcrrualBal,
    nplAcrualAndNormalAccrualBal,
    nplHaveNormalAccrualOrNonNplHaveNplAccrual,
    transactionBackdate,
    closeAccountHavebalance,
    giroPrkCancelCheck,
    GlBalanceCheck,
    GlBalanceVsTrxBal,
    liabiltyMinusCheck,
    loanBaseNSwithLoanSch,
    loanBatchPaymentProcess,
    otBatchCheck,
    wrongAmort
  ]

if (type === "check") {
  return [bfCount, checkCloseBranch, checkDwi, checkCD, acrTime, acrP2PRemain, batAcrP2p, autoDebit, p2pRepay, bulkTemp, unused0, unused9];
}else if (type === "all") {
  if(dateSch[1] == "01"){
    arrDaily.push(checkBatchJobFirstDay)
  }else if(dateSch[0] == "Monday"){
    arrDaily.push(checkBatchJobMonday)
  }else{
    arrDaily.push(checkBatchJobTuesdayFriday)
  }
  return arrDaily;
}else if(type === "daily"){
  arrDaily.push(checkBatchJobFirstDay)
  arrDaily.push(checkBatchJobMonday)
  arrDaily.push(checkBatchJobTuesdayFriday)
  return arrDaily;

}
};

module.exports = {

  date,
};
