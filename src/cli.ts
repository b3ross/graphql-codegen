import { ArgumentParser } from 'argparse';
import * as fs from 'fs';
import * as log from 'winston';

import { Generator } from './generator';
import { Parser } from './parser';

const argumentParser = new ArgumentParser({
  addHelp: true,
  description: 'GraphQL CodeGen'
});
argumentParser.addArgument(['schemaFile'], { help: 'Path to GraphQL schema file' });
argumentParser.addArgument(['outputFile'], { help: 'Path to output file' });

const args = argumentParser.parseArgs();

const parser = new Parser();
parser.parse(fs.readFileSync(args.schemaFile, 'utf8'));

const generator = new Generator(parser.getOutput(), __dirname + '/generators/typescript');
generator.generate();
fs.writeFileSync(args.outputFile, generator.getOutput());
