const sql = require("./db.js");

Customer.getAll = result => {
    sql.query("SELECT * FROM i3_app_users", (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }
  
      console.log("customers: ", res);
      result(null, res);
    });
};

module.exports = Customer;