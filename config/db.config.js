const mongoose = require('mongoose');

const db = mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() =>
    console.log("database is connected")
).catch((error) => console.log("---error---", `${error}`));

module.exports = db;