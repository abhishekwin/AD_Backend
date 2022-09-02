module.exports = {
    getAdminAddress: async (_address) => {
      let getAdmins = JSON.stringify(process.env.LAUNCHPAD_ADMINS);
      let isAdmin = false;
      const stringAdmin = getAdmins.replace(/"/g, "").split(",");
      for (const adminAddress of stringAdmin) {
        if (adminAddress.toLowerCase() == _address.toLowerCase()) {
          isAdmin = true;
        }
      }
      return isAdmin;
    },
  };