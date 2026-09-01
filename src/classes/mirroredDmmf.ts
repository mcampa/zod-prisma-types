import type DMMF from '@prisma/dmmf';

/////////////////////////////////////////////////
// TYPES
/////////////////////////////////////////////////

/**
 * The `DMMF.Field` members this generator mirrors onto its own field classes.
 *
 * The extended classes deliberately do NOT `implement` the DMMF interfaces.
 * Doing so obliges them to carry every member Prisma declares, so a new
 * *required* member in a Prisma release breaks the build even when the
 * generator never reads it — that is what `isParameterizable` did in Prisma
 * 7.10. Picking the members we actually mirror keeps additions to the DMMF a
 * non-event, while still failing loudly if a member we DO use is renamed or
 * removed (`Pick` errors on an unknown key).
 */
export type MirroredDMMFField = Pick<
  DMMF.Field,
  | 'kind'
  | 'name'
  | 'isRequired'
  | 'isList'
  | 'isUnique'
  | 'isId'
  | 'isReadOnly'
  | 'isGenerated'
  | 'isUpdatedAt'
  | 'type'
  | 'dbName'
  | 'hasDefaultValue'
  | 'default'
  | 'relationFromFields'
  | 'relationToFields'
  | 'relationOnDelete'
  | 'relationName'
  | 'documentation'
>;

/**
 * The `DMMF.Model` members this generator mirrors onto its own model classes.
 * `fields` is excluded on purpose — the model classes redeclare it as
 * `ExtendedDMMFField[]`. See {@link MirroredDMMFField} for the rationale.
 */
export type MirroredDMMFModel = Pick<
  DMMF.Model,
  | 'name'
  | 'dbName'
  | 'schema'
  | 'uniqueFields'
  | 'uniqueIndexes'
  | 'documentation'
  | 'primaryKey'
  | 'isGenerated'
>;
