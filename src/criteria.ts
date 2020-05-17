export default class Criteria {
  
  protected glue: string = "AND";
  protected rules: (Criteria | CriteriaRule)[] = [];
  
  getGlue(): string {
    return this.glue;
  }
  
  getRules(): (Criteria | CriteriaRule)[] {
    return this.rules;
  }
  
  constructor(glue?: string) {
    if (glue) {
      this.glue = glue.toUpperCase();
    }
  }
  
  addRule(rule: Criteria | CriteriaRule): this {
    this.rules.push(rule);
    return this;
  }
  
  equals(property: string, value: any): this {
    return this.addRule(new CriteriaRule("eq", [property, value]));
  }
  
  notequals(p: string, v: any): this {
    return this.addRule(new CriteriaRule("noteq", [p, v]))
  }
  
  greater(p: string, v: any): this {
    return this.addRule(new CriteriaRule("gt", [p, v]))
  }
  
  less(p: string, v: any): this {
    return this.addRule(new CriteriaRule("lt", [p, v]))
  }
  
  in(p: string, v: any[]): this {
    return this.addRule(new CriteriaRule("in", [p, v]))
  }
  
  notin(p: string, v: any[]): this {
    return this.addRule(new CriteriaRule("notin", [p, v]))
  }
  
  between(p: string, start: any, end: any): this {
    return this.addRule(new CriteriaRule("btw", [p, [start, end]]))
  }
  
  notbetween(p: string, start: any, end: any): this {
    return this.addRule(new CriteriaRule("notbtw", [p, [start, end]]))
  }
  
  like(p: string, v: any): this {
    return this.addRule(new CriteriaRule("like", [p, v]))
  }
  
  notlike(p: string, v: any): this {
    return this.addRule(new CriteriaRule("notlike", [p, v]))
  }
  
  group(glue: string): Criteria {
    let criteria = new Criteria(glue);
    
    this.addRule(criteria);
    
    return criteria;
  }
}

export class CriteriaRule {
  
  public name: string;
  public data: any[];
  
  constructor(name: string, data: any[]) {
    this.name = name;
    this.data = data;
  }
  
}