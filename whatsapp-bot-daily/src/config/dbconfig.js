require("dotenv").config();

module.exports = {
    user          : process.env.DB_USER,
    password      : process.env.DB_PASS,
    connectString : '127.0.0.1:40005/INOAN',
    externalAuth  :  false
  };