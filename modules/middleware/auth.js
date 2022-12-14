const jwt = require("jsonwebtoken");
const jwt_decode = require('jwt-decode');
const { getAdminAddress } = require("../helpers/adminHelper");
const Users = require("../../models/userModel")

module.exports = {
  checkToken: (req, res, next) => {
    const bearerHeaders = req.headers["authorization"];
    
    if (typeof bearerHeaders !== "undefined") {
      const bearer = bearerHeaders.split(" ");
      const bearerToken = bearer[1];
      jwt.verify(bearerToken, process.env.SECRET, async (err, decoded) =>{
        if (err) {
          return res.status(401).json({
            error: err.message,
            status: 401,
            success: false,
          });
        } else {
          req.userData = jwt_decode(bearerToken)
          const findUser = await Users.findOne({ account : req.userData.account.toLowerCase() })
          if(!findUser){
           return res.status(401).json({
              error: "Invalid User",
              status: 401,
              success: false,
            });
          }
          
          next();
        }
      });
    } else {
      res.status(401).json({
        status: 401,
        success: false,
        message: "Auth token is not supplied",
      });
    }
  },
  checkAdminToken: (req, res, next) => {
    const bearerHeaders = req.headers["authorization"];
    console.log(bearerHeaders,">>>>>>>>>>>>>>>>");
    if (typeof bearerHeaders !== "undefined") {
      const bearer = bearerHeaders.split(" ");
      const bearerToken = bearer[1];
      jwt.verify(bearerToken, process.env.SECRET, async function (err, decoded) {
        if (err) {
          res.status(401).json({
            error: err.message,
            status: 401,
            success: false,
          });
        } else {
          let userdata = jwt_decode(bearerToken);
          const isAdmin = await getAdminAddress(userdata.account)
          if (!isAdmin){
            res.status(401).json({
              error: "For Admin only",
              status: 401,
              success: false,
            });
          }
          else{
            next();
          }
        }
      });
    } else {
      res.status(401).json({
        status: 401,
        success: false,
        message: "Auth token is not supplied",
      });
    }
  }
};
