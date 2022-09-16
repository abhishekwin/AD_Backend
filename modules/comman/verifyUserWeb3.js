const Web3 = require("web3");
require("dotenv").config({ path: "../../.env" });
const ethers = require("ethers");

// const Signature = async (message) => {
//   const privateKey = process.env.PRIVATE_KEY; // should be secret ;
//   let web3 = new Web3(process.env.WEB3_VERIFY_SIGNATURE_URL);

//   let signature = await web3.eth.accounts.sign(message, privateKey);
//   console.log(signature, "signature");
//   // signature = signature?.signature;
//   return signature;
// };

exports.VerifySign = async (message) => {
  const userAddress = message.userAddress;
  const nonce = message.nonce;
  const isWhiteListed = message.isWhiteListed;
  let messageN = ethers.utils.solidityPack(
    ["address", "uint256", "bool"],
    [userAddress, nonce, isWhiteListed]
  );
  let messageHash = ethers.utils.keccak256(messageN);
  const privateKey = process.env.PRIVATE_KEY;
  let web3 = new Web3(process.env.WEB3_VERIFY_SIGNATURE_URL);
  let sign = (await web3.eth.accounts.sign(messageHash, privateKey)).signature;
  return sign;
};

// VerifySign("Hello world");
