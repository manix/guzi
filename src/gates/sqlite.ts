import SQLGate from "./sql";
import * as sqlite from "sqlite3";
import SQLiteInterpreter from "./sqlite-interpreter";

export default abstract class SQLiteGate extends SQLGate {
  db: sqlite.Database;

  constructor(db: sqlite.Database) {
    super();

    this.db = db;
  }
  protected getInterpreter() {
    return new SQLiteInterpreter
  }
  protected getRecordsFromResult(result: any): any[] {
    return result;
  }
  protected getAffectedRowsFromResult(result: any): number {
    return result.changes;
  }
  protected async run(sql: string, data: any[]): Promise<any> {

    return await new Promise((r, rj) => {
      if (sql.indexOf("SELECT") === 0) {
        this.db.all(sql, data, function (error, rows) {
          error ? rj(error) : r(rows);
        });
      } else {
        this.db.run(sql, data, function (error) {
          error ? rj(error) : r(this);
        });
      }
    });
  }
  protected getLastInsertIdFromResult(result: any): number {
    return result.lastID;
  }
}