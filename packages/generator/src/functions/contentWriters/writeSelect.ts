import { ExtendedDMMFOutputType } from '../../classes';
import { type ContentWriterOptions } from '../../types';
import { writeZodImport } from '..';
import { getConfig } from '../../config';

export const writeSelect = (
  {
    fileWriter: { writer },
  }: ContentWriterOptions,
  model: ExtendedDMMFOutputType,
) => {
  const {
    useExactOptionalPropertyTypes,
  } = getConfig();

  writer
    .blankLine()
    .write(`export const ${model.name}SelectSchema: `)
    .write(`z.ZodType<Prisma.${model.name}Select> = `)
    .write(`z.object(`)
    .inlineBlock(() => {
      model.fields.forEach((field) => {
        if (field.isEnumOutputType()) {
          return writer
            .write(`${field.name}: `)
            .write(`z.boolean()`)
            .write(`.optional(),`)
            .newLine();
        }

        // when using mongodb, there is no `findMany` arg type created even for lists
        // so the basic arg type needs to be used instead

        if (field.writeSelectFindManyField) {
          return writer
            .write(`${field.name}: `)
            .write(`z.union([`)
            .write(`z.boolean(),`)
            .write(`z.lazy(() => ${field.outputType.type}FindManyArgsSchema)`)
            .write(`])`)
            .write(`.optional()`)
            .write(`,`)
            .newLine();
        }

        if (field.writeSelectField) {
          return writer
            .write(`${field.name}: `)
            .write(`z.union([`)
            .write(`z.boolean(),`)
            .write(`z.lazy(() => ${field.outputType.type}ArgsSchema)`)
            .write(`])`)
            .write(`.optional()`)
            .write(`,`)
            .newLine();
        }

        return writer
          .write(`${field.name}: `)
          .write(`z.boolean()`)
          .write(`.optional(),`)
          .newLine();
      });
    });

  writer
    .write(`)`)
    .write(`.strict()`)
    .conditionalWrite(useExactOptionalPropertyTypes, '.transform(ru)')
    // .write(' as z.ZodType<Prisma.')
    // .write(`${model.name}Select>`)
    .newLine();
};
