export {default as Criteria} from "./criteria";
export {default as Model} from "./model";
export {default as Gateway} from "./gateway";


import MySQLGate from "./gates/mysql";
import SQLiteGate from "./gates/sqlite";
import Criteria from "./criteria";
import * as sqlite from "sqlite3";

abstract class DefaultGate extends SQLiteGate {
  
}

class PetGate extends DefaultGate {
  defineTable(): string {
    return "pets";
  }
  defineFields(): string[] {
    return ["name", "owner_id"];
  }
  definePK(): string[] {
    return ["owner_id", "name"];
  }
  defineRelations(): any {
    return {
      "owner": this.relation(UserGate, "owner_id")
    }
  }
}

class UserGate extends DefaultGate {
  defineTable(): string {
    return "users";
  }
  defineFields(): string[] {
    return ["id", "name"];
  }
  definePK(): string[] {
    return ["id"];
  }
  defineAI(): string {
    return "id"
  }
  defineRelations(): any {
    return {
      "pets": this.relation(PetGate, "id", "owner_id")
    }
  }
}

// let db = new sqlite.Database(__dirname + "/../db.sqlite", err => {
  
//   let gate = new UserGate(db);
//   let pate = new PetGate(db);
  
//   gate.join("pets", pate);
//   gate.find().then(console.log);
  
// });

/*
var connection = mysql.createConnection({
  host: '192.168.1.6',
  user: 'root',
  password: 'kamba1358',
  database: 'test'
});

connection.connect(function () {
  let gate = new UserGate(connection);
  let pate = new PetGate(connection);

  gate.join("pets");

  gate.find().then(pet => {
    console.log(pet);

    pate.join("owner").join("pets");
    pate.find({
      owner_id: 2
    }).then(collection => {
      console.log(JSON.stringify(collection, null, 2));
      connection.end();
    });
  });
});
*/