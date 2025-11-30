import { type ContentWriterOptions } from '../../types';
import { getConfig } from '../../config';

export const writeDecimalJsLikeList = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  const {
    prismaClientPath,
    prismaLibraryPath,
    isPrismaClientGenerator,
  } = getConfig();

  const decimalJsLikeListTypeName = isPrismaClientGenerator
    ? 'DecimalJsLike'
    : 'Prisma.DecimalJsLike';

  writer
    .blankLine()
    .writeLine(
      `export const DecimalJsLikeListSchema: z.ZodType<${decimalJsLikeListTypeName}[]> = z.object({`,
    )
    .withIndentationLevel(1, () => {
      writer
        .writeLine(`d: z.array(z.number()),`)
        .writeLine(`e: z.number(),`)
        .writeLine(`s: z.number(),`)
        .writeLine(`toFixed: z.function(z.tuple([]), z.string()),`);
    })
    .writeLine(`}).array();`);
};
