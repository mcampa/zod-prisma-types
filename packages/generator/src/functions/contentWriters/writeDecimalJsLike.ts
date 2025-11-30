import { type ContentWriterOptions } from '../../types';

export const writeDecimalJsLike = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  writer
    .blankLine()
    .writeLine(`export const DecimalJsLikeSchema = z.preprocess((v, c) => {`)
    .withIndentationLevel(1, () => {
      writer.writeLine(
        `return Decimal.isDecimal(v) && !(v instanceof Decimal) ? new Decimal(v) : v;`,
      );
    })
    .writeLine(`}, z.instanceof(Decimal));`);
};
