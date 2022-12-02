const { MongoTransferer, MongoDBDuplexConnector, LocalFileSystemDuplexConnector } = require('mongodb-snapshot');
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const fs = require("fs")
require('dotenv').config({path: '../.env'});

const uploadDbBackupPath = process.env.DB_BACKUP_PATH;
const dbBackupUrl = process.env.DB_BACKUP_URL
const dataBaseName = process.env.DB_BACKUP_DATA_BASE

async function dumpDataBase() {

    let currentDate = new Date(new Date());
    var prevDate = new Date();  
    prevDate = prevDate.setDate(prevDate.getDate() - 1);
    prevDate = new Date(prevDate)
    let previousFolder = prevDate.getDate() +"-"+(prevDate.getMonth()+1)+"-"+prevDate.getFullYear();
    currentDateWithYear = currentDate.getDate()+"-"+(currentDate.getMonth()+1)+"-"+currentDate.getFullYear();

    currentDateWithTime = [
        currentDate.getDate(),
        currentDate.getMonth()+1,
        currentDate.getFullYear()].join('-')+' '+
       [currentDate.getHours(),
        currentDate.getMinutes(),
        currentDate.getSeconds()].join(':');

    let uploaddir = uploadDbBackupPath;

    if(!fs.existsSync(uploaddir)){
      fs.mkdirSync(uploaddir, 0744);
    }

    uploaddir = uploadDbBackupPath+"/"+currentDateWithYear;
    fs.rmSync(uploadDbBackupPath+"/"+previousFolder, { recursive: true, force: true });
    if(!fs.existsSync(uploaddir)){
        fs.mkdirSync(uploaddir, 0744);
    }

    const dirPath = uploaddir+"/"+currentDateWithTime+'-backup.tar'
    
    const mongo_connector = new MongoDBDuplexConnector({
        connection: {
            uri: dbBackupUrl,
            dbname: dataBaseName,
        },
    });

    const localfile_connector = new LocalFileSystemDuplexConnector({
        connection: {
            path: dirPath,
        },
    });

    const transferer = new MongoTransferer({
        source: mongo_connector,
        targets: [localfile_connector],
    });

    for await (const { total, write } of transferer) {
        //console.log(`remaining bytes to write: ${total - write}`);
    }
}

module.exports = {
    dumpDataBase
};