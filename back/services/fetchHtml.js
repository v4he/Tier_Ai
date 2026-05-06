const axios = require('axios');

async function fetchHtml(url){
    const response = await axios(url);
    return response.data
}

module.exports = { fetchHtml }