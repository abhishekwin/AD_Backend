const axios = require("axios");
async function getMoralisNftData (body, nftData) {
  try {
    const URL = body.cursor
    ? `${process.env.MORALIS_BASE_URL}/nft/${body.account}/owners?chain=${body.chain}&format=decimal&limit=${body.limit}&cursor=${body.cursor}`
    : `${process.env.MORALIS_BASE_URL}/nft/${body.account}/owners?chain=${body.chain}&format=decimal&limit=${body.limit}`
    
    const resMoralis = await axios.get(URL, {
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.MORALIS_KEY,
      },
    });
    if (resMoralis.status === 200){
      nftData.push(...resMoralis.data.result);
      if(resMoralis.data.result.length > 0){
        if(resMoralis.data.cursor){
          body.cursor = resMoralis.data.cursor
          await getMoralisNftData(body, nftData)
        }
      }
      return nftData;
    }
  } catch (error) {
    console.log("e", error);
  }
}
module.exports = {
  getMoralisInfo: async (body) => {
    try {
      const URL = body.cursor
        ? `${process.env.MORALIS_BASE_URL}${body.account}/nft?chain=${body.chain}&format=decimal&limit=${body.limit}&cursor=${body.cursor}`
        : `${process.env.MORALIS_BASE_URL}${body.account}/nft?chain=${body.chain}&format=decimal&limit=${body.limit}`;
      
      const resMoralis = await axios.get(URL, {
        headers: {
          accept: "application/json",
          "X-API-Key": process.env.MORALIS_KEY,
        },
      });
      if (resMoralis.status === 200) return resMoralis.data;
    } catch (error) {
      console.log("e", error);
    }
  },
  setMoralisNftData: async (body) => {
    let nftData = []
    let getMoralisDataresult = await getMoralisNftData(body, nftData);
    return getMoralisDataresult;
  },
};