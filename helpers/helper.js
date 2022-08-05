const fs = require("fs");
module.exports = {
    getUniqueCode: async(length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    },
    writeFileAndAppendData: async(data) => {
        const fs = require('fs');
        fs.appendFile('./appenddata.txt', data+ "\n", function (err) {
        if (err) throw err;
            console.log('---Saved!---');
        });
    }
}