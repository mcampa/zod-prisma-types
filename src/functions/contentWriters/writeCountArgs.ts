import { ExtendedDMMFOutputType } from '../../classes';
import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeCountArgs = (
  { fileWriter: { writer } }: ContentWriterOptions,
  model: ExtendedDMMFOutputType,
) => {
  const { useExactOptionalPropertyTypes, prismaVersion } = getConfig();

  writer
    .blankLine()
    .write(`export const ${model.name}CountOutputTypeArgsSchema: `)
    .conditionalWrite(
      (prismaVersion?.major === 5 && prismaVersion?.minor >= 1) ||
        (prismaVersion?.major && prismaVersion?.major >= 6) ||
        // fallback to newest version of client version cannot be determined
        prismaVersion === undefined,
      `z.ZodType<Prisma.${model.name}CountOutputTypeDefaultArgs> = `,
    )
    .conditionalWrite(
      (prismaVersion?.major === 5 && prismaVersion?.minor === 0) ||
        prismaVersion?.major === 4,
      `z.ZodType<Prisma.${model.name}CountOutputTypeArgs> = `,
    )
    .write('z.object(')
    .inlineBlock(() => {
      writer.writeLine(
        `select: z.lazy(() => ${model.name}CountOutputTypeSelectSchema).nullish(),`,
      );
    })
    .write(`).strict()`)
    .conditionalWrite(useExactOptionalPropertyTypes, '.transform(ru)')
    .write(`;`);
};
