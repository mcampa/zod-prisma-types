import { type ContentWriterOptions } from '../../types';

export const writeDecimalJsLikeList = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  writer
    .blankLine()
    .writeLine(
      `export const DecimalJsLikeListSchema: z.ZodType<DecimalJsLike[]> = z.object({`,
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
