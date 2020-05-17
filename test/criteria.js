const assert = require("assert");
const criteria = require("../build/criteria");
const Criteria = criteria.default;
const CriteriaRule = criteria.CriteriaRule;

describe("Criteria", function() {
  let c = new Criteria;
  
  it("Glue", function () {
    assert(c.getGlue(), "AND");
    
    let ic = new Criteria("OR");
    
    assert(ic.getGlue(), "OR");
  });
  
  it("Rules and Groups", function () {
    
    c.equals("id", 4).notequals("id", 8);
    c.greater("id", 15).less("id", 16);
    c.in("id", [23]).notin("id", [42]);
    c.between("id", [4, 8]).notbetween("id", [15, 16]);
    c.group("OR").like("id", "23").notlike("id", "42");
    
    assert.equal(JSON.stringify(c), '{"glue":"AND","rules":[{"name":"eq","data":["id",4]},{"name":"noteq","data":["id",8]},{"name":"gt","data":["id",15]},{"name":"lt","data":["id",16]},{"name":"in","data":["id",[23]]},{"name":"notin","data":["id",[42]]},{"name":"btw","data":["id",[[4,8],null]]},{"name":"notbtw","data":["id",[[15,16],null]]},{"glue":"OR","rules":[{"name":"like","data":["id","23"]},{"name":"notlike","data":["id","42"]}]}]}');
  });
  
});