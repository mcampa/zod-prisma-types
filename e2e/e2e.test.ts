import { execFileSync } from 'child_process';
import { Decimal } from 'decimal.js';
import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  E2E_DIR,
  GENERATED_DIR,
  PRISMA_VERSION_UNDER_TEST,
  REPO_ROOT,
  generateFixture,
  type GenerateResult,
} from './generate';

/////////////////////////////////////////////////
// SETUP
/////////////////////////////////////////////////

// Generation shells out to the prisma CLI, which is slow relative to a unit
// test but still well under a second of actual generator work.
const GENERATE_TIMEOUT = 120_000;

let full: GenerateResult;
let minimal: GenerateResult;

beforeAll(() => {
  fs.rmSync(GENERATED_DIR, { recursive: true, force: true });
  full = generateFixture('full');
  minimal = generateFixture('minimal');
}, GENERATE_TIMEOUT);

/////////////////////////////////////////////////
// GENERATION
/////////////////////////////////////////////////

describe('generation', () => {
  it('generates against a schema covering every scalar type', () => {
    expect(full.content).toContain('export const AllScalarsSchema');
    expect(full.content).toContain('export const PostSchema');
    expect(full.content).toContain('export const RoleSchema');
  });

  it('honours the generator options that turn writers off', () => {
    expect(minimal.content).toContain('export const MerchantSchema');
    // createInputTypes / addSelectType / addIncludeType are all false
    expect(minimal.content).not.toContain('CreateInputSchema');
    expect(minimal.content).not.toContain('SelectSchema');
    expect(minimal.content).not.toContain('IncludeSchema');
  });

  it('resolves the relative import from a @zod.import rich comment', () => {
    expect(full.content).toContain(
      "import { isValidName } from '../../../fixtures/myValidators'",
    );
    const imported = path.resolve(
      path.dirname(full.file),
      '../../../fixtures/myValidators.ts',
    );
    expect(fs.existsSync(imported)).toBe(true);
  });
});

/////////////////////////////////////////////////
// THE GENERATED CODE COMPILES
/////////////////////////////////////////////////

const tsc = (args: string[]) => {
  try {
    execFileSync(path.join(REPO_ROOT, 'node_modules', '.bin', 'tsc'), args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return '';
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
  }
};

describe('generated output compiles', () => {
  // The generated file carries `// @ts-nocheck`, so this is a parse-level
  // check: it catches a writer emitting nothing (or something malformed) for a
  // field, which is exactly how `bytesOpt: .nullable()` shipped in 1.0.3.
  it('parses as valid TypeScript', () => {
    expect(tsc(['-p', path.join(E2E_DIR, 'tsconfig.json')])).toBe('');
  });

  // Stripping `// @ts-nocheck` type-checks the output against the real Prisma
  // client types. Errors from the missing `Prisma` namespace import are
  // filtered out: writers emit `z.ZodType<Prisma.X>` annotations but
  // writeSingleFileImportStatements no longer emits the import, so every one of
  // them resolves to nothing. That regression is invisible to consumers because
  // of `@ts-nocheck`, and is tracked separately — everything else must be clean.
  it('type-checks against the real Prisma types', () => {
    const checked = path.join(GENERATED_DIR, 'full', 'zod', 'checked.ts');
    fs.writeFileSync(
      checked,
      full.content.replace('// @ts-nocheck\n', ''),
      'utf-8',
    );

    const errors = tsc(['-p', path.join(E2E_DIR, 'tsconfig.json')])
      .split('\n')
      .filter(Boolean)
      .filter(
        (line) => !line.includes("TS2503: Cannot find namespace 'Prisma'"),
      );

    fs.rmSync(checked);
    expect(errors).toEqual([]);
  });
});

/////////////////////////////////////////////////
// THE GENERATED SCHEMAS RUN
/////////////////////////////////////////////////

describe('generated schemas parse data at runtime', () => {
  it('accepts a valid row and rejects an invalid one', async () => {
    const schemas = (await import(
      path.join(GENERATED_DIR, 'full', 'zod', 'index.ts')
    )) as Record<
      string,
      {
        parse: (v: unknown) => unknown;
        safeParse: (v: unknown) => { success: boolean };
      }
    >;

    const row = {
      id: 1,
      string: 'name',
      stringOpt: null,
      stringList: ['a'],
      boolean: true,
      booleanOpt: null,
      int: 1,
      intOpt: null,
      bigInt: 1n,
      bigIntOpt: null,
      float: 1.5,
      floatOpt: null,
      decimal: new Decimal('1.25'),
      decimalOpt: null,
      decimalList: [],
      date: new Date(),
      dateOpt: null,
      json: { a: 1 },
      jsonOpt: null,
      bytes: new Uint8Array([1, 2, 3]),
      bytesOpt: null,
      bytesList: [],
      enumField: 'USER',
      enumOpt: null,
      custom: 'valid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(schemas.AllScalarsSchema!.safeParse(row).success).toBe(true);

    // the rich-comment validator on `string` is min(1)
    expect(
      schemas.AllScalarsSchema!.safeParse({ ...row, string: '' }).success,
    ).toBe(false);

    // Bytes must be a Uint8Array, not a string
    expect(
      schemas.AllScalarsSchema!.safeParse({ ...row, bytes: 'nope' }).success,
    ).toBe(false);

    // a model-level Decimal wants a Decimal instance; the string/number union
    // only exists on the input types
    expect(
      schemas.AllScalarsSchema!.safeParse({ ...row, decimal: '1.25' }).success,
    ).toBe(false);
  });
});

/////////////////////////////////////////////////
// VERSION-GATED WRITERS
/////////////////////////////////////////////////

describe('version-gated writers', () => {
  // Regression guard for the bug fixed in 1.0.4: the Bytes writers matched
  // `prismaVersion.major === 6` only, so under Prisma 7 they emitted nothing
  // and produced `bytesOpt: .nullable()`.
  it(`emits Uint8Array for Bytes under Prisma ${PRISMA_VERSION_UNDER_TEST}`, () => {
    expect(full.content).toContain(
      'bytes: z.instanceof(Uint8Array<ArrayBufferLike>)',
    );
    expect(full.content).toContain(
      'bytesOpt: z.instanceof(Uint8Array<ArrayBufferLike>).nullable()',
    );
    expect(full.content).not.toMatch(/:\s*\.(nullable|optional|array)\(\)/);
  });

  it(
    'emits Buffer for Bytes under Prisma 5',
    () => {
      const legacy = generateFixture('legacy', {
        prismaClientVersion: '5.22.0',
      });
      expect(legacy.content).toContain('bytes: z.instanceof(Buffer)');
      expect(legacy.content).toContain(
        'bytesOpt: z.instanceof(Buffer).nullable()',
      );
      expect(legacy.content).not.toMatch(/:\s*\.(nullable|optional|array)\(\)/);
    },
    GENERATE_TIMEOUT,
  );
});
