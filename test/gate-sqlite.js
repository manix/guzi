const sqlite = require("sqlite3");
const Gate = require("../build/gates/sqlite").default;
const tests = require("../tests.json");

if (tests.drivers.sqlite) {
  var db = new sqlite.Database(__dirname + "/" + tests.drivers.sqlite);

  class DefaultGate extends Gate {
  
    constructor() {
      super(db);
    }
  }
  
  describe("SQLite Gateway", function () {
  
    it("Create tables", function (done) {
      new Promise((r, e) => {
        db.run("delete from sqlite_sequence;", (err) => err ? e(err) : r());
      }).then(() => {
        Promise.all([
          new Promise((r, e) => {
            db.run(`CREATE TABLE IF NOT EXISTS "users" (
              "id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL ON CONFLICT FAIL,
              "name"  VARCHAR(55)
              );`, err => err ? e(err) : r())
          }),
          new Promise((r, e) => {
            db.run(`CREATE TABLE IF NOT EXISTS "pets" (
                "id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL ON CONFLICT FAIL,
                "owner_id" INTEGER,
                "name"  VARCHAR(55)
                );`, err => err ? e(err) : r())
          }),
        ]).then(() => done());
      });
    });
  
    let test = (require("./abstract/gate-full-test")(DefaultGate));
  });
  
}
