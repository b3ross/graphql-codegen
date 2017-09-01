import * as graphql from 'graphql';
import {
  DocumentNode,
  DefinitionNode,
  ObjectTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  EnumValueDefinitionNode,
  DirectiveNode,
  TypeNode
} from 'graphql';
import { Model, Class, Directive, Enum, Field, Scalar, Type } from './model';

class Visitor {
  private model: Model;

  constructor(model: Model) {
    this.model = model;
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode, key: number, parent: object) {
    if (node.name.value === 'Query' || node.name.value === 'Mutation') {
      return;
    }
    const result = new Class();
    result.name = node.name.value;
    result.directives = node.directives.map((directive: DirectiveNode) => this.handleDirective(directive));
    result.fields = node.fields.map((field: FieldDefinitionNode) => this.handleField(field));
    this.model.classes.push(result);
  }

  ScalarTypeDefinition(node: ScalarTypeDefinitionNode) {
    const result = new Scalar();
    result.name = node.name.value;
    this.model.scalars.push(result);
  }

  EnumTypeDefinition(node: EnumTypeDefinitionNode) {
    const result = new Enum();
    result.name = node.name.value;
    result.values = node.values.map((value: EnumValueDefinitionNode) => value.name.value);
    this.model.enums.push(result);
  }

  private handleField(node: FieldDefinitionNode): Field {
    const result = new Field();
    result.name = node.name.value;
    result.directives = node.directives.map((directive: DirectiveNode) => this.handleDirective(directive));
    result.type = this.handleType(node.type);
    return result;
  }

  private handleDirective(node: DirectiveNode): Directive {
    const result = new Directive();
    result.name = node.name.value;
    for (const arg of node.arguments) {
      // tslint:disable-next-line no-any
      result.arguments.push({ name: arg.name.value, value: (arg.value as any).value });
    }
    return result;
  }

  private handleType(node: TypeNode, prev: Type = undefined): Type {
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

export class Parser {
  private tree: Array<DefinitionNode>;
  private result: Model;

  parse(schema: string) {
    const parsed: DocumentNode = graphql.parse(schema);
    this.tree = parsed.definitions;
    this.result = new Model();
    graphql.visit(this.tree, new Visitor(this.result));
  }

  getOutput(): Model {
    return this.result;
  }
}
