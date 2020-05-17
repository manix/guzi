import SQLGate from "./sql";
import * as mysql from "mysql";

export default abstract class MySQLGate extends SQLGate {
  connection: mysql.IPool | mysql.IConnection;

  constructor(c: mysql.IPool | mysql.IConnection) {
    super("mysql");

    this.connection = c;
  }
  protected getRecordsFromResult(result: any): any[] {
    return result.results;
  }
  protected getAffectedRowsFromResult(result: any): number {
    return result.results.affectedRows;
  }
  protected async run(sql: string, data: any[]): Promise<any> {
    return await new Promise((r, rj) => {
      this.connection.query(sql, data, function (error, results, fields) {
        if (error) {
          rj(error);
        } else {
          r({results, fields});
        }
      });
    });
  }
  protected getLastInsertIdFromResult(result: any): number {
    return result.results.insertId;
  }
}