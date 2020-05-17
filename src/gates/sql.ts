import Criteria from "../criteria";
import Model from "../model";
import DataObject from "../data-object";
import Gateway from "../gateway";
import Interpreter from "./sql-interpreter";
import * as squel from "squel";

export default abstract class SQLGateway extends Gateway {

  protected static lastAlias: number = 0;
  protected static aliasPrefix: string = "_";
  protected alias: string = "";
  protected squel: squel.Squel;

  constructor(flavor?: squel.Flavour) {
    super();
    /*
     * Used retarded switch statement because types are written as 
     * equally as retarded and a variable can not be used.
     */
    switch (flavor) {
      case "mysql":
        this.squel = squel.useFlavour("mysql");
        break;

      case "mssql":
        this.squel = squel.useFlavour("mssql");
        break;

      case "postgres":
        this.squel = squel.useFlavour("postgres");
        break;

      default:
        this.squel = squel;
        break;
    }
    this.alias = this.alias || SQLGateway.generateAlias();
  }

  protected getInterpreter() {
    return new Interpreter();
  }

  protected async insert(data: DataObject, fields: string[]): Promise<DataObject> {
    let qb = this.squel.insert().into(this.table);

    fields.forEach(field => {
      qb.set(field, data[field] || null);
    });

    let result = await this.runQB(qb);

    if (this.getAffectedRowsFromResult(result) === 1) {
      data[this.ai] = this.getLastInsertIdFromResult(result);

      return data;
    } else {
      throw "ENOINS";
    }
  }

  protected async update(data: DataObject, fields: string[]): Promise<DataObject> {
    let qb = this.squel.update().table(this.table);

    fields.forEach(field => {
      qb.set(field, data[field] || null);
    });

    this.pk.forEach(field => qb.where("`" + field + "` = ?", data[field]));

    let result = await this.runQB(qb);

    if (this.getAffectedRowsFromResult(result) === 1) {
      return data;
    } else {
      throw "ENOUPD";
    }
  }

  protected runQB(qb: squel.QueryBuilder): Promise<any> {
    let {text, values} = qb.toParam();
    return this.run(text, values);
  }

  protected abstract async run(sql: string, data: any[]): Promise<any>;
  protected abstract getLastInsertIdFromResult(result: any): number;
  protected abstract getAffectedRowsFromResult(result: any): number;
  protected abstract getRecordsFromResult(result: any): DataObject[];

  async persist(model: Model, fields: string[] = []): Promise<Model> {

    if (!fields.length) {
      fields = this.getFields();
    }

    let data = this.pack(model);

    /*
     * if (model has all pk fields) then
     *   if (there is an AI) then
     *     update
     *   else
     *     try
     *       update
     *     catch
     *       if (0 rows were updated) then
     *         insert
     *       else
     *         delegate error
     * else
     *    insert
     */
    if (this.pk.reduce((present, field) => {
      return present && model[field]
    }, true)) {
      if (this.ai) {
        data = await this.update(data, fields);
      } else {
        try {
          data = await this.update(data, fields);
        } catch (e) {
          if (e === "ENOUPD") {
            data = await this.insert(data, fields);
          } else {
            throw e;
          }
        }
      }
    } else {
      data = await this.insert(data, fields);
    }

    Model.fill(model, this.unpack(data));

    return model;
  }

  async wipeBy(criteria: Criteria): Promise<number> {
    let qb = this.squel.delete().from(this.table);

    qb.where(this.getInterpreter().patch(this.squel.expr(), criteria, this.alias));

    return this.getAffectedRowsFromResult(await this.runQB(qb));
  }

  async findBy(criteria: Criteria): Promise<Model[]> {
    let qb = this.squel.select().from(this.table, this.alias).fields(this.getFields().map(field => this.alias + "." + field));

    this.addJoins(qb);

    qb.where(this.getInterpreter().patch(this.squel.expr(), criteria, this.alias));

    return this.parseJoins(this.getRecordsFromResult(await this.runQB(qb)))
  }

  protected addJoins(qb: squel.Select, base: string = ""): void {

    if (Object.keys(this.joins).length) {
      for (let field in this.joins) {
        let gate = this.joins[field];

        if (gate instanceof SQLGateway) {
          let alias = gate.alias = gate.alias || SQLGateway.generateAlias();
          let colAlias = base + alias + "_";

          gate.addJoins(qb.left_join(gate.table, alias, this.alias + "." + this.getLocalRelationKey(field) + " = " + alias + "." + this.getRemoteRelationKey(field, gate)), colAlias);

          qb.fields(gate.getFields().reduce((o, field) => {
            (<any> o)[alias + "." + field] = colAlias + field;
            return o;
          }, {}))
        }
      }
    }
  }

  protected static generateAlias() {
    return this.aliasPrefix + (this.lastAlias++).toString(36);
  }

  protected prefixFilter(row: DataObject, prefix: string, unset = false): DataObject {
    let o = {};
    let len: number = prefix.length;
    for (let key in row) {
      if (key.indexOf(prefix) === 0) {
        (<any> o)[key.substring(len)] = row[key];
        if (unset) {
          delete (row[key]);
        }
      }
    }
    return o;
  }

  protected parseJoins(set: DataObject[]): Model[] {
    let joined: any = {};

    set.forEach((row, index) => {
      let pks: string = this.pk.map(field => row[field]).join(".");

      if (pks) {
        if (!joined[pks]) {
          joined[pks] = row;
          for (let field in this.joins) {
            joined[pks][field] = [];
          }
        }
        for (let field in this.joins) {
          let gate = this.joins[field];
  
          (<any[]> joined[pks][field]).push(this.prefixFilter(row, (<SQLGateway> this.joins[field]).alias + "_", true));
        }
      }
      delete (set[index]);
    });
    if (Object.keys(this.joins).length) {
      for (let pks in joined) {
        for (let field in this.joins) {
          joined[pks][field] = (<SQLGateway> this.joins[field]).parseJoins(joined[pks][field]);
        }
      }
    }

    return this.instantiate(Object.values(joined));
  }
}
