const Web3 = require("web3");
require("dotenv").config({ path: "../../.env" });

const Signature = async (message) => {
  const privateKey = process.env.PRIVATE_KEY; // should be secret ;
  let web3 = new Web3(process.env.WEB3_VERIFY_SIGNATURE_URL);

  let signature = await web3.eth.accounts.sign(message, privateKey);
  console.log(signature, "signature");
  // signature = signature?.signature;
  return signature;
};

 exports.VerifySign = async(message) =>{
  let signature = await Signature(message);

  let web3 = new Web3(process.env.WEB3_VERIFY_SIGNATURE_URL);

  let verifySign = web3.eth.accounts.recover(message, signature.signature);

  console.log(verifySign, "verifySign");
  
  return verifySign
}

// VerifySign("Hello world");
