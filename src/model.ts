export class Directive {
  name: string;
  arguments: DirectiveArgument[] = [];
}

export class DirectiveArgument {
  name: string;
  value: string;
}

export class Field {
  directives?: Directive[] = [];
  name: string;
  type?: Type;
  isRequired?: boolean;
}

export class Scalar {
  name?: string;
  description?: string;
  value: string;
}

export class Class {
  directives?: Directive[];
  name?: string;
  description?: string;
  fields?: Field[];
}

export class Enum {
  name: string;
  values: string[] = [];
}

export class Type {
  name: string;
  isList: boolean;
  isNonNull: boolean;
}

export class Model {
  classes: Class[] = [];
  enums: Enum[] = [];
  scalars: Scalar[] = [];

  public allNames(): string[] {
    let names: string[] = this.classes.map(o => o.name);
    names = names.concat(this.enums.map(e => e.name));
    names = names.concat(this.scalars.map(s => s.name));
    console.log(JSON.stringify(names));
    return names;
  }
}
