import { type ContentWriterOptions } from '../../types';

export const writeTransformJsonNull = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  writer
    .newLine()
    .write(`export type NullableJsonInput = `)
    .write(`JsonValue | `)
    .write(`null | `)
    .write(`'JsonNull' | `)
    .write(`'DbNull' | `)
    .write(`typeof DbNull | `)
    .write(`typeof JsonNull;`)
    .blankLine();

  writer
    .write(`export const transformJsonNull = (v?: NullableJsonInput) => `)
    .inlineBlock(() => {
      writer
        .writeLine(`if (!v || v === 'DbNull') return DbNull;`)
        .writeLine(`if (v === 'JsonNull') return JsonNull;`)
        .writeLine(`return v;`);
    })
    .write(`;`);
};
