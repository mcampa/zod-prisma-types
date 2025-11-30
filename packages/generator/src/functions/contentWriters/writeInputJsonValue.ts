import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeInputJsonValue = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  const {
    prismaClientPath,
    prismaLibraryPath,
    isPrismaClientGenerator,
  } = getConfig();

  const inputJsonValueTypeName = isPrismaClientGenerator
    ? 'InputJsonValue'
    : 'Prisma.InputJsonValue';

  writer
    .blankLine()
    .writeLine(
      `export const InputJsonValueSchema: z.ZodType<${inputJsonValueTypeName}> = z.lazy(() =>`,
    )
    .withIndentationLevel(1, () => {
      writer
        .writeLine('z.union([')
        .withIndentationLevel(2, () => {
          writer
            .writeLine(`z.string(),`)
            .writeLine(`z.number(),`)
            .writeLine(`z.boolean(),`)
            .writeLine(`z.object({ toJSON: z.any() }),`)
            .writeLine(
              `z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),`,
            )
            .writeLine(
              `z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),`,
            );
        })
        .writeLine(`])`);
    })
    .writeLine(`);`);
  writer
    .blankLine()
    .writeLine(
      `export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;`,
    );
};
