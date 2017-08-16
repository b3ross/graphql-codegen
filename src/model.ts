export class Directive {
  name: string;
}

export class Field {
  directives?: Directive[];
  name: string;
  type?: string;
  isArray?: boolean;
  isRequired?: boolean;
}

export class Scalar {
  name?: string;
  description?: string;
  value: string;
}

export class Type {
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

export class Model {
  objects: Type[] = [];
  enums: Enum[] = [];
  scalars: Scalar[] = [];
}
