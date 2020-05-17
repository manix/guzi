const assert = require("assert");
const Model = require("../build/model").default;

describe("Model", function () {

  it("Construct without data", function () {
    let m = new Model;

    assert.equal(Object.keys(m).length, 0);
  });

  it("Construct with data", function () {
    let m = new Model({id: 4});
    
    assert.equal(Object.keys(m).length, 1);
    assert.equal(m.id, 4);    
  });
  
});