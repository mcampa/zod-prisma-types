import { type WriteStatements } from '../types';
import { writeZodImport } from '.';
import { getConfig } from '../config';
import { getExtendedDMMF } from '../classes';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeSingleFileImportStatements: WriteStatements = ({
  writer,
  writeImport,
}) => {
  const { prismaClientPath, prismaLibraryPath, isPrismaClientGenerator } =
    getConfig();

  const dmmf = getExtendedDMMF();

  writeZodImport(writeImport);

  // If using the "prisma-client" compiler, we can import directly from the
  // runtime library to avoid importing the entire client.
  if (isPrismaClientGenerator) {
    const prismaBrowserRuntimePath = '@prisma/client/runtime/index-browser';
    const namesToImport = [];
    const namesToImportFromPrismaClient = [];

    if (dmmf.schema.hasJsonTypes) {
      namesToImportFromPrismaClient.push('type JsonValue');
      namesToImportFromPrismaClient.push('type InputJsonValue');
      namesToImport.push('DbNull, JsonNull, AnyNull');
    }

    if (dmmf.schema.hasDecimalTypes) {
      namesToImportFromPrismaClient.push('type DecimalJsLike');
      writeImport('{ Decimal }', 'decimal.js');
    }

    if (namesToImportFromPrismaClient.length > 0) {
      writeImport(
        `{ ${namesToImportFromPrismaClient.join(', ')} }`,
        `${prismaLibraryPath}`,
      );
    }

    if (namesToImport.length > 0) {
      writeImport(
        `{ ${namesToImport.join(', ')} }`,
        `${prismaBrowserRuntimePath}`,
      );
    }
  } else {
    // Prisma should primarily be imported as a type, but if there are json fields,
    // we need to import the whole namespace because the null transformation
    // relies on the Prisma.JsonNull and Prisma.DbNull objects
    if (dmmf.schema.hasJsonTypes || dmmf.schema.hasDecimalTypes) {
      writeImport(`{ Prisma }`, `${prismaClientPath}`);
    } else {
      writeImport(`type { Prisma }`, `${prismaClientPath}`);
    }
  }

  if (dmmf.customImports) {
    dmmf.customImports.forEach((statement) => {
      writer.writeLine(statement);
    });
  }
};
