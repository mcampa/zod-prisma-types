import { ExtendedDMMFSchemaEnum } from '../../classes';
import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writePrismaEnum = (
  { fileWriter: { writer } }: ContentWriterOptions,
  { useNativeEnum, values, name }: ExtendedDMMFSchemaEnum,
) => {
  const { isPrismaClientGenerator } = getConfig();

  if (useNativeEnum) {
    writer.blankLine().write(`export const ${name}Schema = z.enum([`);
    values.forEach((value, idx) => {
      const writeComma = idx !== values.length - 1;

      writer.write(`'${value}'${writeComma ? ',' : ''}`);
    });
    writer.write(`]);`);
  } else {
    if (name === 'JsonNullValueInput') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value) => {
        writer.write(`'${value}',`);
      });
      const jsonNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.JsonNull'
        : 'Prisma.JsonNull';
      writer.write(
        `]).transform((value) => (value === 'JsonNull' ? ${jsonNullTypeName} : value));`,
      );

      return;
    }

    if (name === 'NullableJsonNullValueInput') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value) => {
        writer.write(`'${value}',`);
      });
      const jsonNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.JsonNull'
        : 'Prisma.JsonNull';
      const dbNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.DbNull'
        : 'Prisma.DbNull';
      writer.write(
        `]).transform((value) => value === 'JsonNull' ? ${jsonNullTypeName} : value === 'DbNull' ? ${dbNullTypeName} : value);`,
      );

      return;
    }
    if (name === 'JsonNullValueFilter') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value) => {
        writer.write(`'${value}',`);
      });
      const jsonNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.JsonNull'
        : 'Prisma.JsonNull';
      const dbNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.DbNull'
        : 'Prisma.DbNull';
      const anyNullTypeName = isPrismaClientGenerator
        ? 'objectEnumValues.instances.AnyNull'
        : 'Prisma.AnyNull';
      writer.write(
        `]).transform((value) => value === 'JsonNull' ? ${jsonNullTypeName} : value === 'DbNull' ? ${dbNullTypeName} : value === 'AnyNull' ? ${anyNullTypeName} : value);`,
      );

      return;
    }

    writer.write(`export const ${name}Schema = z.enum([`);
    values.forEach((value) => {
      writer.write(`'${value}',`);
    });
    writer.write(`])`);
  }
};
