module.exports = {
    getUTCDate: async () => {
        var date = new Date();
        var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                        date.getUTCDate(), date.getUTCHours(),
                        date.getUTCMinutes(), date.getUTCSeconds());
        return new Date(now_utc);
        // console.log(new Date(now_utc));
        // console.log(date.toISOString());
    },
  };

