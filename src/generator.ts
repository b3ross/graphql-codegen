// Types and enums from graphql-js
// Handlebars
// Directive support
// Enum translation
// Unit tests

import * as graphql from 'graphql';
import * as fs from 'fs';
import { Location } from 'graphql/language/ast';
import * as handlebars from 'handlebars';

import { Model, ObjectDef, Directive, Enum, Field, Scalar, Type } from './model';

class Parser {
  private tree: any;
  private result: Model;

  constructor() {}

  parse(schema: any) {
    const parsed = graphql.parse(schema);
    this.tree = parsed.definitions;
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
    const result = new ObjectDef();
    result.name = node.name.value;
    result.directives = node.directives.map((directive: any) => this.handleDirective(directive));
    result.fields = node.fields.map((field: any) => this.handleField(field));
    this.model.objects.push(result);
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
    result.type = this.handleType(node.type);
    return result;
  }

  private handleDirective(node: any): Directive {
    const result = new Directive();
    result.name = node.name.value;
    for (const arg of node.arguments) {
      result.arguments[arg.name.value] = arg.value.value;
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

class TypescriptGenerator {
  private model: Model;

  constructor(model: Model) {
    this.model = model;
  }

  generateFile(fileName: string) {}

  generate(): string {
    return handlebars.compile(this.loadFromPath(__dirname + '/generators/template.handlebars'))(this.model);
  }

  loadFromPath(filePath: string): string {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`Template file ${filePath} does not exists!`);
    }
  }
}

const parser = new Parser();
parser.parse(fs.readFileSync(__dirname + '/../schema.graphql', 'utf8'));
const generator = new TypescriptGenerator(parser.getOutput());
console.log(generator.generate());
// Parser: schema string -> intermediate
// Generator: intermediate -> typescript
