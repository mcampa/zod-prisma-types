import { type ContentWriterOptions } from '../../types';
import { writeZodImport } from '..';
import { getConfig } from '../../config';

export const writeDecimalJsLike = ({
  fileWriter: { writer, writeImport },
  getSingleFileContent = false,
}: ContentWriterOptions) => {
  const { useMultipleFiles } = getConfig();

  if (useMultipleFiles && !getSingleFileContent) {
    writeZodImport(writeImport);
    writeImport('{ Decimal }', 'decimal.js');
  }
  writer
    .blankLine()
    .writeLine(`export const DecimalJsLikeSchema = z.preprocess((v, c) => {`)
    .withIndentationLevel(1, () => {
      writer.writeLine(
        `return Decimal.isDecimal(v) && !(v instanceof Decimal) ? new Decimal(v) : v;`,
      );
    })
    .writeLine(`}, z.instanceof(Decimal));`);

  if (useMultipleFiles && !getSingleFileContent) {
    writer.blankLine().writeLine(`export default DecimalJsLikeSchema;`);
  }
};
