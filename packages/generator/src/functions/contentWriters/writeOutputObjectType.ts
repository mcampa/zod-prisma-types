import { writeNonScalarType, writeScalarType, writeSpecialType } from '..';
import { ExtendedDMMFSchemaField } from '../../classes';
import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeOutputObjectType = (
  { fileWriter }: ContentWriterOptions,
  field: ExtendedDMMFSchemaField,
) => {
  const { writer } = fileWriter;

  const {
    useExactOptionalPropertyTypes,
    // useTypeAssertions,
  } = getConfig();

  writer
    .blankLine()
    .write(`export const ${field.argName}Schema: `)
    .write(field.customArgType)
    .write(` = `)
    .write(`z.object(`)
    .inlineBlock(() => {
      const modelType =
        typeof field.modelType === 'string'
          ? field.modelType
          : field.modelType.name;
      writer
        .conditionalWriteLine(
          field.writeSelectArg,
          `select: ${modelType}SelectSchema.optional(),`,
        )
        .conditionalWriteLine(
          field.writeIncludeArg,
          `include: ${modelType}IncludeSchema.optional(),`,
        );
      field.args.forEach((arg) => {
        writer.write(`${arg.name}: `);

        const { isOptional, isNullable } = arg;

        if (arg.hasMultipleTypes) {
          writer.write(`z.union([ `);

          arg.inputTypes.forEach((inputType, idx) => {
            const writeComma = idx !== arg.inputTypes.length - 1;

            writeScalarType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
            writeNonScalarType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
            writeSpecialType(writer, {
              inputType,
              writeLazy: false,
              writeComma,
            });
          });

          writer
            .write(` ])`)
            .conditionalWrite(arg.isOptional, `.optional()`)
            .conditionalWrite(arg.isNullable, `.nullable()`)
            .write(`,`);
        } else {
          writeScalarType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
          writeNonScalarType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
          writeSpecialType(writer, {
            inputType: arg.inputTypes[0],
            writeLazy: false,
            isNullable,
            isOptional,
          });
        }

        writer.newLine();
      });
    })
    .write(`)`)
    .write(`.strict()`)
    .conditionalWrite(useExactOptionalPropertyTypes, '.transform(ru)')
    .write(`;`);
  // .conditionalWrite(useTypeAssertions, `as ${field.customArgType};`)
  // .conditionalWrite(!useTypeAssertions, `;`);
};
