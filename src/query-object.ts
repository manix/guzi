import DataObject from "./data-object";
import Criteria from "./criteria";

export type SimpleValue = string | number;
export type ComparisonArray = [string, SimpleValue];
export type QueryObjectValue = SimpleValue | ComparisonArray;

export default class QueryObject implements DataObject {

  static readonly EQUALS = "=";
  static readonly NOTEQUALS = "!=";
  static readonly LESS = "<";
  static readonly GREATER = ">";
  static readonly IN = "[]";
  static readonly NOTIN = "![]";
  static readonly BETWEEN = "><";
  static readonly NOTBETWEEN = "!><";
  static readonly LIKE = "~";
  static readonly NOTLIKE = "!~";
  static readonly COMPARISON_OPERATORS = {
    [QueryObject.EQUALS]: "equals",
    [QueryObject.NOTEQUALS]: "notequals",
    [QueryObject.LESS]: "less",
    [QueryObject.GREATER]: "greater",
    [QueryObject.IN]: "in",
    [QueryObject.NOTIN]: "notin",
    [QueryObject.BETWEEN]: "between",
    [QueryObject.NOTBETWEEN]: "notbetween",
    [QueryObject.LIKE]: "like",
    [QueryObject.NOTLIKE]: "notlike"
  };

  [key: string]: QueryObjectValue;

  static interpret(o: QueryObject, c: Criteria): Criteria {
    for (let field in o) {
      let v: any = o[field];
      let operator: string;
      let args: any[] = [field];

      if (Array.isArray(v)) {
        operator = v[0];
        args.push(...v.slice(1));
      } else {
        operator = QueryObject.EQUALS;
        args.push(v);
      }
      
      try {
        (<() => {}>(<any> c)[
          QueryObject.COMPARISON_OPERATORS[operator]
        ]).apply(c, args);
      } catch (e) {

      }
    }

    return c;
  }
}