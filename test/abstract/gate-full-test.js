const { Model, Criteria } = require("../../build/main");
const assert = require("assert");

module.exports = function (DefaultGate) {

  class User extends Model {

    getPetNames() {
      return this.pets.map(p => p.name).join(", ");
    }
  }

  class Pet extends Model {

  }

  class UserGate extends DefaultGate {

    constructor(...a) {
      super(...a);

      this.MODEL = User;
    }

    defineTable() {
      return "users";
    }
    defineFields() {
      return ["id", "name"]
    }
    definePK() {
      return ["id"]
    }
    defineAI() {
      return "id";
    }
    defineRelations() {
      return {
        "pets": this.relation(PetGate, "id", "owner_id")
      }
    }
  }

  class PetGate extends DefaultGate {

    constructor(...a) {
      super(...a);

      this.MODEL = Pet;
    }

    defineTable() {
      return "pets";
    }
    defineFields() {
      return ["id", "name", "owner_id"];
    }
    definePK() {
      return ["id"];
    }
    defineAI() {
      return "id";
    }
    defineRelations() {
      return {
        "owner": this.relation(UserGate, "owner_id")
      }
    }
  }

  let gate = new UserGate();
  let pate = new PetGate();

  this.gate = gate;

  it("Persist", function (done) {

    let user = { name: "Manix" };
    let pets = [
      { name: "Pet", owner_id: 1 },
      { name: "Met", owner_id: 1 }
    ];

    Promise.all([gate.persist(user).then(persisted => {

      assert.equal(user, persisted);
      assert.equal(user.id, 1, "Test auto increment");

    }), pate.persistCollection(pets).then(collection => {
      
      assert.deepEqual(pets, collection);
      // assert.equal(pets[0].id, 1, "Test auto increment");
      // assert.equal(pets[0].name, "Pet", "Test auto increment");
      // assert.equal(pets[1].id, 2, "Test auto increment");
      // assert.equal(pets[1].name, "Met", "Test auto increment");

    }), gate.persistCollection([
      { name: "Hasan" },
    ]).then(() => {
      gate.persistCollection([
        { name: "Sandokan" }
      ])
    }), pate.persistCollection([
      { name: "Petrohan", owner_id: 2 }
    ])

    ]).then(() => done()).catch(done);

  });

  describe("Retrieve", function () {

    it("Find without parameters", function (done) {

      gate.find().then(list => {
        assert(Array.isArray(list));
        assert.strictEqual(list.length, 3);

        done();
      }).catch(done);

    });

    it("Find by primary key", function (done) {

      gate.find("1").then(list => {
        let user = list[0];

        assert.strictEqual(user.name, "Manix");

        done();
      }).catch(done);

    });

    it("Find by query object", function (done) {

      pate.find({
        owner_id: 2
      }).then(list => {
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0].name, "Petrohan")

        done();
      }).catch(done);

    });

    it("Find by criteria", function (done) {
      let c = new Criteria();
      c.in("id", [1, 3]);

      pate.findBy(c).then(list => {
        assert.strictEqual(list.length, 2);
        assert.strictEqual(list.map(pet => pet.id).join(","), "1,3");

        done();
      }).catch(done);

    });

    it("Join", function () {
      assert.strictEqual(gate.join("pets", pate), pate);
      assert.deepEqual(gate.joins, { "pets": pate });
    });

    it("Find with relation", function (done) {
      gate.find().then(list => {
        assert.strictEqual(list.reduce((count, user) => {
          return count + user.pets.length;
        }, 0), 3);

        let pets = [null, ["Pet", "Met"], ["Petrohan"], []];

        list.forEach(user => {
          user.pets.forEach(pet => {
            assert(pets[user.id].indexOf(pet.name) > -1)
          });
        });

        done();
      }).catch(done);

    });

    describe("Find by all possible criteria", function () {

      gate.unjoin("pets");

      function findBy(criteria, ids, done) {
        gate.findBy(criteria).then(list => {
          assert.deepEqual(list.map(u => u.id), ids);

          done();
        }).catch(done);
      }
      // skip testing equals because it is already tested above

      it("Not equals", function (done) {
        findBy(new Criteria().notequals("id", 1), [2, 3], done);
      });

      it("Greater than", function (done) {
        findBy(new Criteria().greater("id", 2), [3], done);
      });

      it("Less than", function (done) {
        findBy(new Criteria().less("id", 3), [1, 2], done);
      });

      it("In", function (done) {
        findBy(new Criteria().in("id", [1, 3]), [1, 3], done);
      });

      it("Not in", function (done) {
        findBy(new Criteria().notin("id", [1, 3]), [2], done);
      });

      it("Between", function (done) {
        findBy(new Criteria().between("id", 2, 3), [2, 3], done);
      });

      it("Not between", function (done) {
        findBy(new Criteria().notbetween("id", 1, 2), [3], done);
      });

      it("Like", function (done) {
        findBy(new Criteria().like("name", "%dok%"), [3], done);
      });

      it("Not like", function (done) {
        findBy(new Criteria().notlike("name", "%nix"), [2, 3], done);
      });

    });
  });

  describe("Overwrite", function () {

    it("Persist then retrieve", function (done) {

      gate.persist({
        id: 2, name: "Genadi"
      }).then(persisted => {

        gate.find(persisted.id).then(collection => {

          assert.strictEqual(collection.length, 1);
          assert.strictEqual(collection[0].name, "Genadi");

          done();

        }).catch(done);

      }).catch(done);

    });

  });

  describe("Wipe", function () {
    it("All", function (done) {

      Promise.all([
        gate.wipe().then(wiped => assert.strictEqual(wiped, 3)),
        pate.wipe().then(wiped => assert.strictEqual(wiped, 3))
      ]).then(() => done()).catch(done);

    });
  });

  return this;
}
