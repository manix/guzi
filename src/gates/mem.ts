import Criteria from "../criteria";
import Model from "../model";
import DataObject from "../data-object";
import Gateway from "../gateway";
import Interpreter from "./mem-interpreter";

let dbs: {
  [key: string]: InMemoryDatabase
} = {};

function useDB(name: string): InMemoryDatabase {
  if (!dbs[name]) {
    dbs[name] = new InMemoryDatabase;
  }

  return dbs[name];
}

export class InMemoryDatabase {
  public tables: {
    [key: string]: {
      ai: number,
      data: DataObject
    }
  } = {};

  getTable(name: string) {
    if (!this.tables[name]) {
      this.tables[name] = {
        ai: 1,
        data: {}
      };
    }

    return this.tables[name];
  }
}

export default abstract class InMemoryGateway extends Gateway {

  readonly PK_CONCAT = "/";
  protected db: InMemoryDatabase;

  constructor(dbname: string = "default") {
    super();

    this.db = useDB(dbname);
  }

  async persist(model: Model, fields: string[] = []): Promise<Model> {
    let data: DataObject = {};

    (fields.length ? fields : this.getFields()).forEach((field: string) => {
      data[field] = model[field] || null;
    });

    if (this.ai && !model[this.ai]) {
      data[this.ai] = this.db.getTable(this.table).ai++;
    }

    data = this.pack(data);

    // Set timestamps, AI and other generated data back into the model
    Model.fill(model, this.unpack(data));

    this.db.getTable(this.table).data[this.getPKString(model)] = data;

    return model;
  }

  getPKString(model: Model | DataObject): string {
    return this.pk.map(field => model[field]).join(this.PK_CONCAT);
  }

  async wipeBy(criteria: Criteria): Promise<number> {
    let data = this.db.getTable(this.table).data;

    return this.readAndFilter(criteria).reduce((count, row) => {
      return count + (delete (data[this.getPKString(row)]) ? 1 : 0);
    }, 0);
  }

  async find(...pk: any[]): Promise<Model[]> {
    if (typeof pk[0] !== "object" && pk.length === this.pk.length) {
      return this.instantiate([await this.performJoins(this.db.getTable(this.table).data[this.getPKString(pk.reduce((model, value, index) => {
        model[this.pk[index]] = value;
        return model;
      }, new Model))])]);
    } else {
      return super.find(...pk);
    }
  }

  async findBy(criteria: Criteria): Promise<Model[]> {
    return this.instantiate(await Promise.all(this.readAndFilter(criteria).map(row =>
      this.performJoins(row)
    )));
  }

  protected readAndFilter(criteria: Criteria): DataObject[] {
    let interpreter = new Interpreter(criteria);
    let data = this.db.getTable(this.table).data;
    let set: DataObject[] = [];

    for (let key in data) {
      if (interpreter.validate(data[key])) {
        set.push(this.fields.reduce((o, field) => {
          (<any>o)[field] = data[key][field];
          return o;
        }, {}));
      }
    }

    return set;
  }

  async performJoins(row: DataObject): Promise<DataObject> {
    if (Object.keys(this.joins).length) {
      let joins: Promise<void>[] = [];

      for (let field in this.joins) {
        let gate = this.joins[field];

        joins.push(gate.findBy(new Criteria().equals(this.getRemoteRelationKey(field, gate), row[this.getLocalRelationKey(field)]))
          .then(collection => {
            row[field] = collection;
          }));
      }

      return await Promise.all(joins).then(d => {
        return row;
      }).catch(e => {throw e});
    } else {
      return row;
    }
  }
}