const mysql = require("mysql");
const Gate = require("../build/gates/mysql").default;
const tests = require("../tests.json").drivers;

if (tests.mysql.host) {
  var connection = mysql.createConnection({
    host: tests.mysql.host,
    user: tests.mysql.user,
    password: tests.mysql.pass,
    multipleStatements: true
  });
  
  connection.connect(function (err) {
    if (err) throw err;
  });
  
  class DefaultGate extends Gate {
  
    constructor(db = "db") {
      super(connection);
    }
  }
  
  describe("MySQL Gateway", function () {
    function rs() {
      connection.query("DROP DATABASE guzitests");
    }
  
    let clean = rs.bind(this);
  
    after(clean);
  
  
    it("Create tables", function (done) {
      let sql = `
      CREATE DATABASE guzitests;
      USE guzitests;
      CREATE TEMPORARY TABLE users (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=MEMORY DEFAULT CHARSET=utf8;
      CREATE TEMPORARY TABLE pets (
        owner_id int(11) NOT NULL,
        name varchar(255) NOT NULL,
        id int(11) NOT NULL AUTO_INCREMENT,
        PRIMARY KEY (id)
      ) ENGINE=MEMORY DEFAULT CHARSET=utf8;
      `
  
      connection.query(sql, function (err, result) {
        if (err) throw err;
        done();
      });
    });
  
    let fkgate = (require("./abstract/gate-full-test")(DefaultGate)).gate;
  });
  
}
