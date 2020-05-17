import Criteria from "../criteria";
import DataObject from "../data-object";
import * as squel from "squel";

type fn = "eq" | "noteq" | "gt" | "lt" | "in" | "notin" | "btw" | "notbtw" | "like" | "notlike";

export default class Interpreter {

  patch(expr: squel.Expression, c: Criteria, alias: string): squel.Expression {
    let chain = expr[c.getGlue() === "OR" ? "or" : "and"];

    return c.getRules().reduce((expr: squel.Expression, rule) => {
      if (rule instanceof Criteria) {
        return chain.call(expr, this.patch(squel.expr(), rule, alias));
      } else {
        let arr = Array.isArray(rule.data[1]) ? rule.data[1] : [rule.data[1]];
        return chain.call(expr, this[<fn> rule.name](alias + "." + rule.data[0], arr.length), ...arr)
      }
    }, expr);
  }

//      switch ($criteria->glue())   {
//      case 'OR'  :
//        $method = 'orWhere'  ;
//        break  ;
//      default  :
//        $method = 'where'  ;
//        break  ;
//      }
//    foreach ($criteria->rules() as $rule)   {
//      if ($rule instanceof Criteria)   {
//        $query->whereGroupStart()  ;
//        $this->patch($query, $rule)  ;
//        $query->whereGroupEnd()  ;
//      } else   {
//        foreach ($rule as $key => $data)   {
//          $query->$method($query->alias . '.' . $data[0], $this->$key(...$data), $data[1])  ;
//          }
//        }
//    }

  eq(data: string, argc: number): string {
    return data + " = ?";
  }
  noteq(data: string, argc: number): string {
    return data + " != ?";
  }
  gt(data: string, argc: number): string {
    return data + " > ?";
  }
  lt(data: string, argc: number): string {
    return data + " < ?";
  }
  in(data: string, argc: number): string {
    return data + ` IN (${",?".repeat(argc).substring(1)})`;
  }
  notin(data: string, argc: number): string {
    return data + ` NOT IN (${",?".repeat(argc).substring(1)})`;
  }
  btw(data: string, argc: number): string {
    return "(" + data + " BETWEEN ? AND ?)";
  }
  notbtw(data: string, argc: number): string {
    return "(" + data + " NOT BETWEEN ? AND ?)";
  }
  like(data: string, argc: number): string {
    return data + " LIKE ?";
  }
  notlike(data: string, argc: number): string {
    return data + " NOT LIKE ?";
  }

}