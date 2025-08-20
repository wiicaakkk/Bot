const datas = [{
    1: 'T005101' ,
    2: '1',
    3: '1',
    4: '1',
    5: '1101',
    6: null,
    7: null,
    8: 'T002670',
    9: '02',
    10: 'T002670',
    11: null,
    12: '00',
    13: null,
    14: 'T002670',
    15: "TO_DATE('2019/07/16', 'YYYY/MM/DD')",
    16: "TO_DATE('2019/07/16', 'YYYY/MM/DD')",
    17: '10:00:00',
    18: 'MIG',
    19: "TO_DATE('2019/07/16', 'YYYY/MM/DD')",
    20: '10:00:00',
    21: 'MIG',
    22: null
  },{
    1: 'T005685' ,
    2: '1',
    3: '1',
    4: '2',
    5: '1101',
    6: null,
    7: null,
    8: 'T005101',
    9: '02',
    10: 'T005101',
    11: "TO_DATE('2019/07/16', 'YYYY/MM/DD')",
    12: '00',
    13: null,
    14: 'T005101',
    15: "TO_DATE('2020/06/29', 'YYYY/MM/DD')",
    16: "TO_DATE('2020/06/29', 'YYYY/MM/DD')",
    17: '10:00:00',
    18: 'MIG',
    19: "TO_DATE('2020/06/29', 'YYYY/MM/DD')",
    20: '10:00:00',
    21: 'MIG',
    22: null
  },{
    1: 'T321516' ,
    2: '1',
    3: '1',
    4: '3',
    5: '1101',
    6: null,
    7: null,
    8: 'T005685',
    9: '99',
    10: 'T005685',
    11: "TO_DATE('2020/06/29', 'YYYY/MM/DD')",
    12: '00',
    13: null,
    14: 'T005685',
    15: "TO_DATE('2021/02/10', 'YYYY/MM/DD')",
    16: "TO_DATE('2021/02/10', 'YYYY/MM/DD')",
    17: '10:00:00',
    18: 'MIG',
    19: "TO_DATE('2021/02/10', 'YYYY/MM/DD')",
    20: '10:00:00',
    21: 'MIG',
    22: null
  },{
    1: 'T002390930' ,
    2: '1',
    3: '1',
    4: '4',
    5: '1101',
    6: null,
    7: null,
    8: 'T321516',
    9: '99',
    10: 'T321516',
    11: "TO_DATE('2021/02/10', 'YYYY/MM/DD')",
    12: '00',
    13: null,
    14: 'T321516',
    15: "TO_DATE('2021/09/10', 'YYYY/MM/DD')",
    16: "TO_DATE('2021/09/10', 'YYYY/MM/DD')",
    17: '10:00:00',
    18: 'MIG',
    19: "TO_DATE('2021/09/10', 'YYYY/MM/DD')",
    20: '10:00:00',
    21: 'MIG',
    22: null
  },];
  
  let insertSql = null;
//   console.log(Boolean(null));

  datas.forEach((data) => {
    for (let i = 1; i <= 22; i++) {
        if(data[i]){
            data[i].substring(0,2) == 'TO'? data[i] = `${data[i]}` : data[i] = `'${data[i]}'`
        }
    }
    insertSql = `INSERT INTO ACOM_LMT_BASEHD_DTLSHIS VALUES (${data[1]}, ${data[2]}, ${data[3]}, ${data[4]}, ${data[5]}, ${data[6]}, ${data[7]}, ${data[8]}, ${data[9]}, ${data[10]}, ${data[11]}, ${data[12]}, ${data[13]}, ${data[14]}, ${data[15]}, ${data[16]}, ${data[17]}, ${data[18]}, ${data[19]}, ${data[20]}, ${data[21]}, ${data[22]});`

    console.log(insertSql);
  })
