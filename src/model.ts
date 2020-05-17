import DataObject from "./data-object";

export default class Model implements DataObject {
  
  [key: string]: any;

  constructor(data: DataObject = {}) {
    Model.fill(this, data);
  }

  static fill(model: Model, data: DataObject) {
    for (let prop in data) {
      model[prop] = data[prop];
    }
  }
}
