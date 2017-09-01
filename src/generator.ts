import * as graphql from 'graphql';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as log from 'winston';

import { Model, Class, Directive, Enum, Field, Scalar, Type } from './model';
import { Parser } from './parser';

type ConfigurationMap = { [key: string]: ConfigurationMap | string };

export class Generator {
  private model: Model;
  private typeMapping: ConfigurationMap;
  private enumerationMapping: ConfigurationMap;
  private configuration: ConfigurationMap;
  private output: string;
  private configurationPath: string;

  constructor(model: Model, configurationPath: string) {
    this.configurationPath = configurationPath;
    this.model = model;
    this.configuration = this.loadConfiguration();
    this.typeMapping = this.getTypeMapping();
    this.enumerationMapping = this.getEnumerationMapping();
  }

  generate(): void {
    handlebars.registerHelper('mapType', (type: string) => {
      if (type in this.typeMapping) {
        return this.typeMapping[type];
      } else {
        throw new Error(`Could not find mapping for type ${type}`);
      }
    });
    handlebars.registerHelper('mapEnumeration', (enumeration: string, value: string) => {
      const configured: string = this.getConfigurationValue(this.enumerationMapping, enumeration, value);
      if (configured) {
        return configured;
      } else {
        return value;
      }
    });
    const template = this.loadFile(this.configurationPath + '/template.handlebars');
    const compiled: HandlebarsTemplateDelegate = handlebars.compile(template);
    this.output = compiled(this.model);
  }

  getOutput(): string {
    return this.output;
  }

  private loadConfiguration(): ConfigurationMap {
    return JSON.parse(this.loadFile(this.configurationPath + '/config.json'));
  }

  private getTypeMapping(): ConfigurationMap {
    const typeMap: ConfigurationMap = this.getConfigurationValue(this.configuration, 'typeMapping');
    for (const name of this.model.allNames()) {
      if (!(name in typeMap)) {
        typeMap[name] = name;
      }
    }
    return typeMap;
  }

  private getEnumerationMapping(): ConfigurationMap {
    return this.getConfigurationValue(this.configuration, 'enumerationMapping');
  }

  private loadFile(filePath: string): string {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`File ${filePath} does not exists!`);
    }
  }

  // tslint:disable no-any
  private getConfigurationValue(source: ConfigurationMap, ...path: string[]): any {
    let cur: any = source;
    for (const element of path) {
      if (cur === undefined) {
        return undefined;
      }
      cur = cur[element];
    }
    return cur;
  }

  // tslint:enable no-any
}
