import Criteria from "../criteria";
import DataObject from "../data-object";

export default class Interpreter {
  
  protected code: string;
  
  constructor(criteria: Criteria) {
    this.code = this.interpret(criteria);
  }
  
  interpret(criteria: Criteria): string {
    let rules = criteria.getRules();
    
    return rules.map(rule => {
      if (rule instanceof Criteria) {
        return "(" + this.interpret(rule) + ")";
      } else {
        return "this." + rule.name + "(data['" + rule.data[0] + "'], " + JSON.stringify(rule.data[1]) + ")";
      }
    }).join(criteria.getGlue() === "OR" ? "||" : "&&") || "true";
  }
  
  validate(data: DataObject) {
    return eval(this.code);
  }
  
  eq(data: any, value: any): boolean {
    return data == value;
  }
  noteq(data: any, value: any): boolean {
    return data != value;
  }
  gt(data: any, value: any): boolean {
    return data > value;
  }
  lt(data: any, value: any): boolean {
    return data < value;
  }
  in(data: any, values: any[]): boolean {
    return values.indexOf(data) > -1;
  }
  notin(data: any, value: any[]): boolean {
    return !this.in(data, value);
  }
  btw(data: any, values: any[]): boolean {
    return data >= values[0] && data <= values[1];
  }
  notbtw(data: any, values: any[]): boolean {
    return !this.btw(data, values);
  }
  like(data: string, value: any): boolean {
    return data.indexOf(value.replace(/%/g, "")) > -1;
  }
  notlike(data: string, value: any): boolean {
    return !this.like(data, value);
  }
  
}