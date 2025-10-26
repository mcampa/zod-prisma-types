import { writeFieldAdditions } from '.';
import { ExtendedWriteFieldOptions } from '../../types';

export const writeDecimal = ({
  writer,
  field,
  writeOptionalDefaults = false,
}: ExtendedWriteFieldOptions) => {
  writer
    .conditionalWrite(field.omitInModel(), '// omitted: ')
    .write(`${field.formattedNames.original}: `)
    .write(`DecimalJsLikeSchema,`);

  writeFieldAdditions({ writer, field, writeOptionalDefaults });
};
