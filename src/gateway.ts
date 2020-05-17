import Model from "./model";
import DataObject from "./data-object";
import QueryObject from "./query-object";
import Criteria from "./criteria";
import {Relation} from "./relations";

export default abstract class Gateway {

  readonly MODEL = Model;
  readonly TIMESTAMP_CREATED = "created";
  readonly TIMESTAMP_UPDATED = "updated";

  protected table: string;
  protected fields: string[];
  protected ai: string;
  protected pk: string[];

  // TODO add interfaces
  protected rel: {
    [key: string]: Relation
  };
  protected joins: {
    [key: string]: Gateway
  } = {};

  protected sorter: any;

  protected cutoff: number = 0;
  protected limit: number = 1000;

  protected timestamps: boolean = false;

  abstract defineTable(): string;
  abstract defineFields(): string[];
  abstract definePK(): string[];

  defineAI(): string {
    return "";
  }

  defineRelations(): {[key: string]: Relation} {
    return {};
  }

  relation(gateClass: any, localField?: string, remoteField?: string): Relation {
    return {
      to: gateClass,
      local: localField || "",
      remote: remoteField || ""
    };
  }

  constructor() {
    this.table = this.defineTable();
    this.fields = this.defineFields();
    this.pk = this.definePK();
    this.ai = this.defineAI();
    this.rel = this.defineRelations();
  }

  getTable(): string {
    return this.table;
  }

  getPK(): string[] {
    return this.pk;
  }

  getAI(): string {
    return this.ai;
  }

  getFields(): string[] {
    let fields = this.fields;

    if (this.timestamps) {
      fields.push(this.TIMESTAMP_CREATED);
      fields.push(this.TIMESTAMP_UPDATED);
    }

    return fields;
  }

  setFields(fields: string[]): this {
    this.fields = fields;

    return this;
  }

  addField(field: string): this {
    this.removeField(field);
    this.fields.push(field);

    return this;
  }

  removeField(field: string): this {
    this.fields = this.fields.filter(f => f !== field);

    return this;
  }

  abstract async persist(model: Model, fields: string[]): Promise<Model>;

  persistCollection(collection: Model[], fields: string[] = []): Promise<Model[]> {
    return Promise.all(collection.map(model => this.persist(model, fields)));
  }

  async wipe(...qd: any[]): Promise<number> {
    return this.wipeBy(this.constructCriteriaFromQueryData(qd));
  }

  abstract async wipeBy(criteria: Criteria): Promise<number>;

  async find(...qd: any[]): Promise<Model[]> {
    return this.findBy(this.constructCriteriaFromQueryData(qd));
  }

  protected constructCriteriaFromQueryData(qd: any[]): Criteria {
    let qo: QueryObject;
    
    if (typeof qd[0] === "object") {
      qo = <QueryObject> qd[0];
    } else {
      qo = this.constructQueryObjectFromPKArray(qd);
    }
    
    return QueryObject.interpret(qo, new Criteria);
  }

  protected constructQueryObjectFromPKArray(pk: any[]): QueryObject {
    return pk.reduce((o: QueryObject, value, index) => {
      o[this.pk[index]] = value;
      return o;
    }, new QueryObject);
  }

  abstract async findBy(criteria: Criteria): Promise<Model[]>;

  protected instantiate(set: DataObject[]): Model[] {
    let collection: Model[] = [];
    
    set.forEach(row => {
      collection.push(new this.MODEL(this.unpack(row)));
    });

    return collection;
  }

  pack(row: DataObject): DataObject {
    return row;
  }

  unpack(row: DataObject): DataObject {
    return row;
  }

  join(rel: string, gate?: Gateway | string[]): Gateway {
    if (this.rel[rel]) {
      if (Array.isArray(gate)) {
        gate = this.constructGateForJoin(this.rel[rel].to).setFields(gate);
      } else if (!gate) {
        gate = this.constructGateForJoin(this.rel[rel].to);
      }

      if (gate instanceof Gateway) {
        this.joins[rel] = gate;

        return gate;
      } else {
        throw new Error("Trying to join invalid object");
      }
    } else {
      throw new Error("Trying to join undefined relation");
    }
  }

  unjoin(rel: string): void {
    delete (this.joins[rel]);
  }

  async count(criteria: Criteria = new Criteria): Promise<number> {
    return (await this.findBy(criteria)).length;
  }

  getLocalRelationKey(rel: string): string {
    return this.rel[rel].local || rel;
  }

  getRemoteRelationKey(rel: string, remoteGate: Gateway): string {
    return this.rel[rel].remote || remoteGate.getPK()[0];
  }

  constructGateForJoin(gateClass: new () => Gateway): Gateway {
    return new gateClass;
  }
}