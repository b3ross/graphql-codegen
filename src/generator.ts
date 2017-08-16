import * as graphql from 'graphql';
import * as fs from 'fs';
import { Model, Type, Directive, Enum, EnumValue, Field, Scalar } from './model';

class Parser {
  private tree: any;
  private result: Model;

  constructor() {}

  parse(schema: any) {
    const parsed = graphql.parse(schema);
    console.info(JSON.stringify(parsed));
    this.tree = parsed.definitions;
    this.result = new Model();

    graphql.visit(this.tree, new Visitor(this.result));
    console.info(this.result.scalars.length);
    console.info(this.result.objects.length);
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

  ObjectTypeDefinition(node: any) {
    const result = new Type();
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
    this.model.enums.push(result);
  }

  private handleDirective(directive: any): Directive {
    const result = new Directive();
    result.name = directive.name.value;
    return result;
  }

  private handleField(field: any): Field {
    const result = new Field();
    result.name = field.name.value;
    result.type = this.handleType(field.type);
    return result;
  }

  private handleType(type: any): string {
    console.info(type);
    if (!type) {
      return undefined;
    }
    // TODO
    return type.name.value;
  }
}

class TypescriptGenerator {
  private tree: any;

  constructor(tree: any) {
    this.tree = tree;
  }

  generateFile(fileName: string) {}

  generateString() {}
}

const parser = new Parser();
parser.parse(fs.readFileSync(__dirname + '/../schema.graphql', 'utf8'));
const generator = new TypescriptGenerator(parser.getOutput());

// Parser: schema string -> intermediate
// Generator: intermediate -> typescript
