import * as graphql from 'graphql';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import { Model, Class, Directive, Enum, Field, Scalar, Type } from './model';

class Parser {
  private tree: any;
  private result: Model;

  constructor() {}

  parse(schema: any) {
    const parsed = graphql.parse(schema);
    this.tree = parsed.definitions;
    console.info(JSON.stringify(this.tree, null, 2));
    this.result = new Model();
    graphql.visit(this.tree, new Visitor(this.result));
    console.log(JSON.stringify(this.result, null, 2));
  }

  getOutput(): Model {
    return this.result;
  }
}

class Visitor {
  private model: Model;

  constructor(model: Model) {
    this.model = model;
  }

  ObjectTypeDefinition(node: any, key: number, parent: any) {
    if (node.name.value === 'Query' || node.name.value === 'Mutation') {
      return;
    }
    const result = new Class();
    result.name = node.name.value;
    result.directives = node.directives.map((directive: any) => this.handleDirective(directive));
    result.fields = node.fields.map((field: any) => this.handleField(field));
    this.model.classes.push(result);
  }

  ScalarTypeDefinition(node: any) {
    const result = new Scalar();
    result.name = node.name.value;
    this.model.scalars.push(result);
  }

  EnumTypeDefinition(node: any) {
    const result = new Enum();
    result.name = node.name.value;
    result.values = node.values.map((value: any) => value.name.value);
    this.model.enums.push(result);
  }

  private handleField(node: any): Field {
    const result = new Field();
    result.name = node.name.value;
    result.directives = node.directives.map((directive: any) => this.handleDirective(directive));
    result.type = this.handleType(node.type);
    return result;
  }

  private handleDirective(node: any): Directive {
    const result = new Directive();
    result.name = node.name.value;
    for (const arg of node.arguments) {
      result.arguments.push({ name: arg.name.value, value: arg.value.value });
    }
    return result;
  }

  private handleType(node: any, prev: Type = undefined): Type {
    const result = prev ? prev : new Type();
    if (node.kind === 'NamedType') {
      result.name = node.name.value;
      return result;
    } else {
      if (node.kind === 'NonNullType') {
        result.isNonNull = true;
        return this.handleType(node.type, result);
      } else if (node.kind === 'ListType') {
        result.isList = true;
        return this.handleType(node.type, result);
      }
    }
  }
}

type AnyMap = { [key: string]: any };
type StringMap = { [key: string]: string };

class TypescriptGenerator {
  private model: Model;
  private typeMapping: StringMap;
  private enumerationMapping: AnyMap;
  private configuration: AnyMap;

  constructor(model: Model) {
    this.model = model;
    this.configuration = this.loadConfiguration();
    this.typeMapping = this.getTypeMapping();
    this.enumerationMapping = this.getEnumerationMapping();
  }

  generate(): string {
    handlebars.registerHelper('mapType', (type: string) => {
      if (type in this.typeMapping) {
        return this.typeMapping[type];
      } else {
        throw new Error(`Could not find mapping for type ${type}`);
      }
    });
    handlebars.registerHelper('mapEnumeration', (enumeration: string, value: string) => {
      if (enumeration in this.enumerationMapping && value in this.enumerationMapping[enumeration]) {
        return this.enumerationMapping[enumeration][value];
      } else {
        return value;
      }
    });
    const template = this.loadFile(__dirname + '/generators/template.handlebars');
    const compiled: any = handlebars.compile(template);
    return compiled(this.model);
  }

  private loadConfiguration(): AnyMap {
    return JSON.parse(this.loadFile(__dirname + '/generators/config.json'));
  }

  private getTypeMapping(): StringMap {
    const typeMap: StringMap = this.configuration['typeMapping'];
    for (const name of this.model.allNames()) {
      if (!(name in typeMap)) {
        typeMap[name] = name;
      }
    }
    return typeMap;
  }

  private getEnumerationMapping(): AnyMap {
    return this.configuration['enumerationMapping'];
  }

  private loadFile(filePath: string): string {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`File ${filePath} does not exists!`);
    }
  }
}

const parser = new Parser();
parser.parse(fs.readFileSync(__dirname + '/../schema.graphql', 'utf8'));
const generator = new TypescriptGenerator(parser.getOutput());
console.log(generator.generate());
