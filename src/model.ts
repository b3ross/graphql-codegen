export class Directive {
  name: string;
  arguments: { [argument: string]: string | number } = {};
}

export class Field {
  directives?: Directive[] = [];
  name: string;
  type?: Type;
  isArray?: boolean;
  isRequired?: boolean;
}

export class Scalar {
  name?: string;
  description?: string;
  value: string;
}

export class ObjectDef {
  directives?: Directive[];
  name?: string;
  description?: string;
  fields?: Field[];
}

export class EnumValue {
  name: string;
  description: string;
}

export class Enum {
  name: string;
  values: EnumValue[] = [];
}

export class Type {
  name: string;
  isList: boolean;
  isNonNull: boolean;
}

export class Model {
  objects: ObjectDef[] = [];
  enums: Enum[] = [];
  scalars: Scalar[] = [];
}
