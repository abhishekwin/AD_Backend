const axios = require('axios');
const { COINMARKET_CAP_API, COINMARKET_CAP_API_KEY } = process.env

const getEthToUsdt = async(amount, symbol) => {
let response = null;
return new Promise(async (resolve, reject) => {
  try {
    response = await axios.get(`${COINMARKET_CAP_API}/tools/price-conversion?amount=${amount}&symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKET_CAP_API_KEY,
      },
    });
  } catch(ex) {
    response = null;
    return reject(ex);
  }
  if (response) {
    const json = response.data;
    return resolve(json);
  }
});
}

module.exports = { getEthToUsdt }