const Gate = require("../build/gates/fs").default;
const path = require("path");
const fs = require('fs');
const tests = require("../tests.json");
const dbpath = path.join(__dirname, tests.drivers.fs);

class DefaultGate extends Gate {

  constructor(db = dbpath) {
    super(db);
  }
}

if (tests.drivers.fs) {
  describe("Filesystem Gateway", function () {
    function rm(path) {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
          var curPath = path + "/" + file;
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            rm(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    }
    
    let clean = rm.bind(this, dbpath);
  
    clean.call();
    
    after(clean);
    
    require("./abstract/gate-full-test")(DefaultGate);
  
  });
  
}