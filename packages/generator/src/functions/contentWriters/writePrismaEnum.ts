import { ExtendedDMMFSchemaEnum } from '../../classes';
import { type ContentWriterOptions } from '../../types';

export const writePrismaEnum = (
  { fileWriter: { writer } }: ContentWriterOptions,
  { useNativeEnum, values, name }: ExtendedDMMFSchemaEnum,
) => {
  if (useNativeEnum) {
    writer.blankLine().write(`export const ${name}Schema = z.enum([`);
    values.forEach((value: string, idx: number) => {
      const writeComma = idx !== values.length - 1;

      writer.write(`'${value}'${writeComma ? ',' : ''}`);
    });
    writer.write(`]);`);
  } else {
    if (name === 'JsonNullValueInput') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value: string) => {
        writer.write(`'${value}',`);
      });
      writer.write(
        `]).transform((value) => (value === 'JsonNull' ? JsonNull : value));`,
      );

      return;
    }

    if (name === 'NullableJsonNullValueInput') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value: string) => {
        writer.write(`'${value}',`);
      });
      writer.write(
        `]).transform((value) => value === 'JsonNull' ? JsonNull : value === 'DbNull' ? DbNull : value);`,
      );

      return;
    }
    if (name === 'JsonNullValueFilter') {
      writer.blankLine().write(`export const ${name}Schema = z.enum([`);
      values.forEach((value: string) => {
        writer.write(`'${value}',`);
      });
      writer.write(
        `]).transform((value) => value === 'JsonNull' ? JsonNull : value === 'DbNull' ? DbNull : value === 'AnyNull' ? AnyNull : value);`,
      );

      return;
    }

    writer.write(`export const ${name}Schema = z.enum([`);
    values.forEach((value: string) => {
      writer.write(`'${value}',`);
    });
    writer.write(`])`);
  }
};
