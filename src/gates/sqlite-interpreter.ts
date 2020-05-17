import Interpreter from "./sql-interpreter";

export default class SQLiteInterpreter extends Interpreter {

  btw(data: string): string {
    return data + " BETWEEN ? AND ?";
  }
  notbtw(data: string): string {
    return data + " NOT BETWEEN ? AND ?";
  }
}