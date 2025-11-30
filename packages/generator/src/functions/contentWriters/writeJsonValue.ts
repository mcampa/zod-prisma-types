import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeJsonValue = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  const {
    prismaClientPath,
    prismaLibraryPath,
    isPrismaClientGenerator,
  } = getConfig();

  const jsonValueTypeName = isPrismaClientGenerator
    ? 'JsonValue'
    : 'Prisma.JsonValue';

  writer
    .blankLine()
    .writeLine(
      `export const JsonValueSchema: z.ZodType<${jsonValueTypeName}> = z.lazy(() =>`,
    )
    .withIndentationLevel(1, () => {
      writer
        .writeLine('z.union([')
        .withIndentationLevel(2, () => {
          writer
            .writeLine(`z.string(),`)
            .writeLine(`z.number(),`)
            .writeLine(`z.boolean(),`)
            .writeLine(`z.literal(null),`)
            .writeLine(
              `z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),`,
            )
            .writeLine(`z.array(z.lazy(() => JsonValueSchema)),`);
        })
        .writeLine(`])`);
    })
    .writeLine(`);`);
  writer
    .blankLine()
    .writeLine(`export type JsonValueType = z.infer<typeof JsonValueSchema>;`);
};
