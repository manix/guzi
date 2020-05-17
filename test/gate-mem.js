const Gate = require("../build/gates/mem").default;

class DefaultGate extends Gate {

  constructor(db = "db") {
    super(db);
  }
}

describe("Memory Gateway", function () {
  require("./abstract/gate-full-test")(DefaultGate);
});
