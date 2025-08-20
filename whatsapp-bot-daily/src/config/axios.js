const axios = require("axios")

const API_URL = "http://localhost:3000";

const axiosInstance = axios.create({
    baseURL : API_URL
})

module.exports = axiosInstance