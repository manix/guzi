import Criteria from "../criteria";
import Model from "../model";
import DataObject from "../data-object";
import Gateway from "../gateway";
import Interpreter from "./mem-interpreter";
import * as fs from "fs";
import * as path from "path";
import * as msgpack from "msgpack-lite";
import {promisify} from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readDir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

export default abstract class FilesystemGateway extends Gateway {

  readonly PK_CONCAT = "_";
  readonly AI_FILE = ".ai";

  protected dir: string;

  constructor(dir: string) {
    super();

    this.dir = path.resolve(dir, this.table);

    const sep = path.sep;
    const initDir = path.isAbsolute(this.dir) ? sep : '';
    this.dir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }
      return curDir;
    }, initDir);
  }

  nextAI(): number {
    let file: string = path.resolve(this.dir, this.AI_FILE);

    var ai: number = 0;

    try {
      ai = 1 + parseInt(fs.readFileSync(file).toString());
    } catch (e) {
      ai = 1;
    } finally {
      fs.writeFileSync(file, ai);
    }

    return ai;
  }

  async persist(model: Model, fields: string[] = []): Promise<Model> {
    let data: DataObject = {};

    (fields.length ? fields : this.getFields()).forEach((field: string) => {
      data[field] = model[field] || null;
    });

    if (this.ai && !model[this.ai]) {
      data[this.ai] = this.nextAI();
    }

    data = this.pack(data);

    // Set timestamps, AI and other generated data back into the model
    Model.fill(model, this.unpack(data));

    await writeFile(path.resolve(this.dir, this.getPKString(model)), msgpack.encode(data));

    return model;
  }

  getPKString(model: Model | DataObject): string {
    return this.pk.map(field => model[field]).join(this.PK_CONCAT);
  }

  async wipeBy(criteria: Criteria): Promise<number> {
    return (await Promise.all(
      (await this.readAndFilter(criteria))
        .map(async row => await unlink(path.resolve(this.dir, this.getPKString(row)))))
    ).length;
  }

  async findBy(criteria: Criteria): Promise<Model[]> {
    return this.instantiate(
      (await Promise.all(
        (await this.readAndFilter(criteria))
          .map(async row => await this.performJoins(row))
      )));
  }

  protected async readAndFilter(criteria: Criteria): Promise<DataObject[]> {
    let interpreter = new Interpreter(criteria);

    return (await Promise.all((await readDir(this.dir))
      .filter(file => file.substr(0, 1) !== ".")
      .map(file => this.read(path.resolve(this.dir, file)))))
      .filter(interpreter.validate.bind(interpreter));
  }

  async performJoins(row: DataObject): Promise<DataObject> {
    let joins = Object.entries(this.joins);

    if (joins.length) {
      (await Promise.all(joins.map(async ([field, gate]) =>
        row[field] = await gate.findBy(new Criteria().equals(this.getRemoteRelationKey(field, gate), row[this.getLocalRelationKey(field)]))
      )));
    }

    return row;
  }
  
  async count(criteria: Criteria = new Criteria): Promise<number> {
    return (await this.readAndFilter(criteria)).length;
  }

  async read(path: string): Promise<DataObject> {
    let s = msgpack.decode(await readFile(path));
    
    return this.fields.reduce((o, field) => {
      (<any>o)[field] = s[field];
      return o;
    }, {});
  }
}