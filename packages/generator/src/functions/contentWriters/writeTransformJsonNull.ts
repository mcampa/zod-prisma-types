import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeTransformJsonNull = ({
  fileWriter: { writer, writeImport },
  getSingleFileContent = false,
}: ContentWriterOptions) => {
  const {
    useMultipleFiles,
    prismaClientPath,
    prismaLibraryPath,
    isPrismaClientGenerator,
  } = getConfig();

  // TODO: check how to get DbNUll and JsonNull from PrismaClient without importing the whole namespace

  if (useMultipleFiles && !getSingleFileContent) {
    if (isPrismaClientGenerator) {
      writeImport('type { objectEnumValues, JsonValue }', prismaLibraryPath);
    } else {
      writeImport('{ Prisma }', prismaClientPath);
    }
  }

  const jsonValueTypeName = isPrismaClientGenerator
    ? 'JsonValue'
    : 'Prisma.JsonValue';

  writer
    .newLine()
    .write(`export type NullableJsonInput = `)
    .write(`${jsonValueTypeName} | `)
    .write(`null | `)
    .write(`'JsonNull' | `)
    .write(`'DbNull' | `)
    .write(`DbNull | `)
    .write(`JsonNull;`)
    .blankLine();

  writer
    .write(`export const transformJsonNull = (v?: NullableJsonInput) => `)
    .inlineBlock(() => {
      writer
        .writeLine(`if (!v || v === 'DbNull') return DbNull;`)
        .writeLine(`if (v === 'JsonNull') return JsonNull;`)
        .writeLine(`return v;`);
    })
    .write(`;`);

  if (useMultipleFiles && !getSingleFileContent) {
    writer.blankLine().writeLine(`export default transformJsonNull;`);
  }
};
