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
  const { prismaLibraryPath } = getConfig();

  const dmmf = getExtendedDMMF();

  writeZodImport(writeImport);

  // Import directly from the runtime library to avoid importing the entire client
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

  if (dmmf.customImports) {
    dmmf.customImports.forEach((statement) => {
      writer.writeLine(statement);
    });
  }
};
