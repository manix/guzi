import Gateway from "./gateway";

export interface Relation {

  to: new () => Gateway;
  remote: string;
  local: string;

}
