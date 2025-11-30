import { type ContentWriterOptions } from '../../types';

export const writeNullableJsonValue = ({
  fileWriter: { writer },
}: ContentWriterOptions) => {
  writer
    .blankLine()
    .writeLine(`export const NullableJsonValue = z`)
    .withIndentationLevel(1, () => {
      writer
        .writeLine(
          `.union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])`,
        )
        .writeLine('.nullable()')
        .writeLine(`.transform((v) => transformJsonNull(v));`);
    })
    .blankLine()
    .writeLine(
      `export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;`,
    );
};
