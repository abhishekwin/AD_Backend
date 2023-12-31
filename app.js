const createError = require("http-errors");
const mongoose = require('mongoose')
mongoose.set('strictQuery', true);
const path = require("path");
const express = require("express");
const cors = require("cors");
// const expressUpload = require("express-fileupload");
require("dotenv").config({ path: "./.env" });
require("./config/db.config");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { EventManager } = require("./models");
const { startCron, bscMint, ethMint, mintCountUpdateUsingCollectionBsc, mintCountUpdateUsingCollectionEth } = require("./cron/cron");
const { createLaunchpadNfts, failLaunchpadNfts,  } = require("./cron/mintCron");
const adminRouter = require("./routes/adminRoutes");
const usersRouter = require("./routes/userRoutes");
const uploadFileRoutes = require("./routes/uploadFileRoutes");
const tableQuery = require("./routes/tableQueryRoutes");
const routes = require("./routes");
var cron = require("node-cron");
const Web3 = require("web3");
const collectionERC721Abi = require("./config/collectionERC721.json");
// const { webOnSaleEvent } = require('./cron/onsaleevent');
// const { webOnTransferEvent } = require('./cron/onTransferEvent');
const app = express();
const { dumpDataBase} = require("./cron/mongodbDump");
let timeout = require('connect-timeout');

const port = parseInt(process.env.PORT || "8080");
app.set("port", port);
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors(), function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(haltOnTimedout)
app.use(haltOnTimedout)

app.use("/api", uploadFileRoutes);
app.use("/api", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api", tableQuery);

app.use("/api/launchpad", routes);
app.use("/meta-data", routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message,
  });
});

console.log(`server start on port : ${port}`);

// Optional fallthrough error handler
// app.use(function onError(err, req, res, next) {
//   // The error id is attached to `res.sentry` to be returned
//   // and optionally displayed to the user for support.
//   res.statusCode = 500;
//   res.end(res.sentry + "\n");
// });

// cron.schedule('* * * * *', () => {
//   console.log("---cron running---")
//   ///createLaunchpadNfts()
//   ///failLaunchpadNfts()
// });

// cron.schedule('*/10 * * * * *', () => {
//   console.log("---mint cron running---")
//   ///bscMint()
//   ///ethMint()
//   // mintCountUpdateUsingCollectionBsc()
//   // mintCountUpdateUsingCollectionEth()
// });


cron.schedule(`0 */${process.env.DB_BACKUP_START} * * *`, () => {
  console.log("---dump cron---")
  if(process.env.DB_BACKUP_START){
    dumpDataBase()
  }  
});


// cron.schedule('*/05 * * * * *', () => {
//   //startCron()
// });


function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

app.listen(port).on("error", function (err) {
  console.log("err", err);
});
// app.setTimeout(500000);

module.exports = app;
